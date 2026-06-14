import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import {
  getClient,
  mintInvoiceToken,
  associateToken,
  submitAgentDecision,
  PrivateKey,
} from '@fiduciary/hedera';
import { deployPool } from '@/lib/arc';
import { withRetry } from '@/lib/retry';
import { isCircleConfigured, provisionAgentWallet, setSpendingPolicy } from '@/lib/circleAgentWallet';

// This route chains several on-chain ops (HTS mint → Arc pool deploy → token associate),
// each with retries — it can take far longer than Vercel's default 10s function limit.
// 60s is the Hobby-plan ceiling; without this the function is killed mid-flight → 502.
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const agentName = body?.agentName as string;
  if (!agentName) return NextResponse.json({ error: 'agentName required' }, { status: 400 });

  const bids = store.bids.get(params.invoiceId) || [];
  const winningBid = bids.find(b => b.agentName === agentName);
  if (!winningBid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });

  // On a retry, refuse to switch agents mid-flight — the pool fee/economics and
  // the recorded accepted agent must stay consistent.
  if (
    (invoice as any).acceptedAgentName &&
    (invoice as any).acceptedAgentName !== agentName
  ) {
    return NextResponse.json(
      { error: 'This invoice already accepted a different offer.' },
      { status: 409 }
    );
  }

  // Claim the accepted agent NOW — synchronously, before the first await — so a
  // concurrent request for a DIFFERENT agent hits the guard above and is rejected
  // (Node is single-threaded; this claim is atomic relative to other requests). This
  // closes the race where two different-agent accepts both pass the guard and double-mint.
  if (!(invoice as any).acceptedAgentName) {
    (invoice as any).acceptedAgentName = agentName;
    if (!(invoice as any).status || (invoice as any).status === 'pending_auction') {
      (invoice as any).status = 'funding';
    }
    store.invoices.set(params.invoiceId, invoice);
  }

  // Fully done (token minted, pool deployed, investors associated) → idempotent fast-path.
  // Don't short-circuit if Circle is configured but the agent wallet wasn't provisioned
  // yet — let the flow fall through to the (idempotent, best-effort) provisioning block.
  const agentWalletPending = isCircleConfigured() && !(invoice as any).agentWalletId;
  if (
    (invoice as any).tokenId &&
    (invoice as any).poolAddress &&
    (invoice as any).investorsAssociated &&
    !agentWalletPending
  ) {
    return NextResponse.json({
      tokenId: (invoice as any).tokenId,
      hashscanUrl: `https://hashscan.io/testnet/token/${(invoice as any).tokenId}`,
      poolAddress: (invoice as any).poolAddress,
      agentWalletAddress: (invoice as any).agentWalletAddress ?? null,
      fromCache: true,
    });
  }

  const shortId = params.invoiceId.slice(0, 4).toUpperCase();
  const tokenName = `Invoice ${(invoice as any).clientName} ${invoice.amountUsd}`.slice(0, 90);
  const tokenSymbol = `INV-${shortId}`;

  // Mint the HTS token — skip if a prior attempt already minted it (the Hedera
  // mint is expensive; reuse it on retry). Persist the tokenId immediately so a
  // later pool-deploy failure doesn't waste the mint.
  // ADR-013: for MVP, fee collector = operator (the agent IS the operator).
  let tokenId = (invoice as any).tokenId as string | undefined;
  if (!tokenId) {
    try {
      const client = getClient();
      const operatorId = process.env.HEDERA_OPERATOR_ID!;
      tokenId = await mintInvoiceToken({
        client,
        tokenName,
        tokenSymbol,
        amount: invoice.amountUsd,
        feePercent: winningBid.feePercent,
        feeCollectorId: operatorId,
      });
    } catch (err) {
      // Log the real cause (e.g. INSUFFICIENT_PAYER_BALANCE) — the 502 is intentionally
      // generic for the user, but the server log must be diagnosable.
      console.error('[accept] HTS mint failed:', err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).tokenId = tokenId;
    (invoice as any).acceptedAgentName = agentName;
    (invoice as any).status = 'funding';
    store.invoices.set(params.invoiceId, invoice);

    // Record the agent's underwriting decision to the HCS audit topic — a structured,
    // ORDERED message (sequence-numbered) capturing which agent took this invoice, at what
    // fee, and why. This runs once (inside the first-mint block). Best-effort + non-fatal.
    try {
      const seq = await submitAgentDecision({
        type: 'agent_decision',
        invoiceHash: (invoice as any).invoiceHash ?? null,
        agent: agentName,
        decision: 'accepted',
        feePercent: winningBid.feePercent,
        discountPercent: winningBid.discountPercent,
        riskScore: winningBid.riskScore,
        summary: winningBid.reasoning ?? '',
      });
      (invoice as any).agentDecisionSeq = seq.sequenceNumber;
      store.invoices.set(params.invoiceId, invoice);
    } catch (err) {
      console.error('[accept] agent-decision HCS submit failed (non-fatal):', err);
    }
  }

  // Deploy a fresh per-invoice pool with a small fundable target (faucet-feasible).
  // On-chain target is small USDC; the UI maps it back to Maria's full net dollars.
  // Skip if a prior attempt already deployed it.
  let poolAddress = (invoice as any).poolAddress as string | undefined;
  if (!poolAddress) {
    const targetUsdc = Number(process.env.DEMO_POOL_TARGET_USDC ?? '10');
    const feeBps = Math.round(winningBid.feePercent * 100);
    // clientPaymentAmount must be faucet-feasible (settle pulls it from the operator
    // = the symbolic "client"). Keep it just above target; the UI narrates the
    // symbolic $5,000, the on-chain amount is small. Dollars/USDC dual-denomination.
    const clientPaymentUsdc = targetUsdc + 1;
    try {
      poolAddress = await deployPool(targetUsdc, clientPaymentUsdc, feeBps);
    } catch (err) {
      console.error('[accept] Arc pool deploy failed:', err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).poolAddress = poolAddress;
    store.invoices.set(params.invoiceId, invoice);
  }

  // Associate the two symbolic investor accounts with the freshly minted token so
  // they can receive HTS transfers at settlement. The distribution schedule itself
  // is created AND executed at settle time (Commit 3), not here. Idempotent
  // (TOKEN_ALREADY_ASSOCIATED tolerated) + retried. Skip if already associated.
  if (!(invoice as any).investorsAssociated) {
    try {
      await withRetry(async () => {
        const inv1Id = process.env.HEDERA_INVESTOR1_ID!;
        const inv1Key = PrivateKey.fromStringDer(process.env.HEDERA_INVESTOR1_KEY!);
        const inv2Id = process.env.HEDERA_INVESTOR2_ID!;
        const inv2Key = PrivateKey.fromStringDer(process.env.HEDERA_INVESTOR2_KEY!);
        await associateToken(tokenId!, inv1Id, inv1Key);
        await associateToken(tokenId!, inv2Id, inv2Key);
      });
    } catch (err) {
      console.error('[accept] investor token-associate failed:', err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).investorsAssociated = true;
    store.invoices.set(params.invoiceId, invoice);
  }

  // Provision a Circle Agent Wallet for the winning agent on Arc + record a spending
  // policy (ADR-021). BEST-EFFORT + NON-BLOCKING: only when Circle is configured, and a
  // failure NEVER blocks accept — the verified spine (mint/pool/associate) is already
  // done, and settlement falls back to the operator key if no agent wallet exists.
  if (isCircleConfigured() && !(invoice as any).agentWalletId) {
    try {
      const wallet = await provisionAgentWallet(agentName);
      await setSpendingPolicy(wallet.walletId, { maxAmount: '10000', period: 'daily', token: 'USDC' });
      (invoice as any).agentWalletId = wallet.walletId;
      (invoice as any).agentWalletAddress = wallet.address;
      store.invoices.set(params.invoiceId, invoice);
    } catch (err) {
      console.error('[accept] Circle agent wallet provisioning failed (non-fatal):', err);
    }
  }

  await store.flush(); // persist all the mint/deploy/associate/provision writes
  const hashscanUrl = `https://hashscan.io/testnet/token/${tokenId}`;
  return NextResponse.json({
    tokenId,
    hashscanUrl,
    poolAddress,
    agentWalletAddress: (invoice as any).agentWalletAddress ?? null,
    fromCache: false,
  });
}
