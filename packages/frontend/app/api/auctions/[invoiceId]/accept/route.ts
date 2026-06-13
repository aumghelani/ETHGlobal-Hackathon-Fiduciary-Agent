import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import {
  getClient,
  mintInvoiceToken,
  scheduleDistribution,
  associateToken,
  PrivateKey,
} from '@fiduciary/hedera';
import { deployPool } from '@/lib/arc';
import { withRetry } from '@/lib/retry';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
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

  // Fully done (token minted, pool deployed, schedule created) → idempotent fast-path.
  if ((invoice as any).tokenId && (invoice as any).poolAddress && (invoice as any).scheduleId) {
    return NextResponse.json({
      tokenId: (invoice as any).tokenId,
      hashscanUrl: `https://hashscan.io/testnet/token/${(invoice as any).tokenId}`,
      poolAddress: (invoice as any).poolAddress,
      scheduleId: (invoice as any).scheduleId,
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
    } catch {
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).tokenId = tokenId;
    (invoice as any).acceptedAgentName = agentName;
    (invoice as any).status = 'funding';
    store.invoices.set(params.invoiceId, invoice);
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
    } catch {
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).poolAddress = poolAddress;
    store.invoices.set(params.invoiceId, invoice);
  }

  // Create the per-invoice Hedera distribution schedule (HSS) — associate the
  // token with the two symbolic investor accounts, then build a PENDING schedule
  // that splits the HTS supply 60/40 (ADR-017). Skip if already created.
  // NON-FATAL: mint + pool are the critical legs; if this fails after retries we
  // roll forward with scheduleId null (settlement's Hedera leg can be added later).
  let scheduleId = (invoice as any).scheduleId as string | undefined;
  if (!scheduleId) {
    try {
      scheduleId = await withRetry(async () => {
        const operatorId = process.env.HEDERA_OPERATOR_ID!;
        const inv1Id = process.env.HEDERA_INVESTOR1_ID!;
        const inv1Key = PrivateKey.fromStringDer(process.env.HEDERA_INVESTOR1_KEY!);
        const inv2Id = process.env.HEDERA_INVESTOR2_ID!;
        const inv2Key = PrivateKey.fromStringDer(process.env.HEDERA_INVESTOR2_KEY!);
        const trigId = process.env.HEDERA_SETTLEMENT_TRIGGER_ID!;
        const trigKey = PrivateKey.fromStringDer(process.env.HEDERA_SETTLEMENT_TRIGGER_KEY!);

        await associateToken(tokenId!, inv1Id, inv1Key);
        await associateToken(tokenId!, inv2Id, inv2Key);

        const supply = invoice.amountUsd * 100; // token has 2 decimals
        const amt1 = Math.floor(supply * 0.6);
        const amt2 = supply - amt1;
        const sched = await scheduleDistribution({
          tokenId: tokenId!,
          recipients: [
            { accountId: inv1Id, amount: amt1 },
            { accountId: inv2Id, amount: amt2 },
          ],
          treasuryAccountId: operatorId,
          settlementTrigger: { accountId: trigId, publicKey: trigKey.publicKey },
        });
        return sched.scheduleId;
      });
      (invoice as any).scheduleId = scheduleId;
      store.invoices.set(params.invoiceId, invoice);
    } catch (e) {
      console.error('Schedule creation failed (rolling forward, scheduleId null):', e);
      scheduleId = undefined;
    }
  }

  const hashscanUrl = `https://hashscan.io/testnet/token/${tokenId}`;
  return NextResponse.json({ tokenId, hashscanUrl, poolAddress, scheduleId: scheduleId ?? null, fromCache: false });
}
