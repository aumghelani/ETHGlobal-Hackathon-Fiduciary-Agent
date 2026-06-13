import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getClient, mintInvoiceToken } from '@fiduciary/hedera';
import { deployPool } from '@/lib/arc';

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

  // Fully done (token minted AND pool deployed) → idempotent fast-path.
  if ((invoice as any).tokenId && (invoice as any).poolAddress) {
    return NextResponse.json({
      tokenId: (invoice as any).tokenId,
      hashscanUrl: `https://hashscan.io/testnet/token/${(invoice as any).tokenId}`,
      poolAddress: (invoice as any).poolAddress,
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
    try {
      poolAddress = await deployPool(targetUsdc, 5000, feeBps);
    } catch {
      return NextResponse.json(
        { error: 'Could not secure the offer. Please try again.' },
        { status: 502 }
      );
    }
    (invoice as any).poolAddress = poolAddress;
    store.invoices.set(params.invoiceId, invoice);
  }

  const hashscanUrl = `https://hashscan.io/testnet/token/${tokenId}`;
  return NextResponse.json({ tokenId, hashscanUrl, poolAddress, fromCache: false });
}
