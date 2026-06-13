import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getClient, mintInvoiceToken } from '@fiduciary/hedera';
import { deployPool } from '@/lib/arc';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const body = await req.json();
  const agentName = body.agentName as string;
  if (!agentName) return NextResponse.json({ error: 'agentName required' }, { status: 400 });

  const bids = store.bids.get(params.invoiceId) || [];
  const winningBid = bids.find(b => b.agentName === agentName);
  if (!winningBid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });

  // Idempotent: skip re-mint if already tokenized
  if ((invoice as any).tokenId) {
    return NextResponse.json({
      tokenId: (invoice as any).tokenId,
      hashscanUrl: `https://hashscan.io/testnet/token/${(invoice as any).tokenId}`,
      fromCache: true,
    });
  }

  const shortId = params.invoiceId.slice(0, 4).toUpperCase();
  const tokenName = `Invoice ${(invoice as any).clientName} ${invoice.amountUsd}`.slice(0, 90);
  const tokenSymbol = `INV-${shortId}`;

  const client = getClient();
  const operatorId = process.env.HEDERA_OPERATOR_ID!;

  // ADR-013: for MVP, fee collector = operator (the agent IS the operator)
  const tokenId = await mintInvoiceToken({
    client,
    tokenName,
    tokenSymbol,
    amount: invoice.amountUsd,
    feePercent: winningBid.feePercent,
    feeCollectorId: operatorId,
  });

  // Deploy a fresh per-invoice pool with a small fundable target (faucet-feasible).
  // On-chain target is small USDC; the UI maps it back to Maria's full net dollars.
  const targetUsdc = Number(process.env.DEMO_POOL_TARGET_USDC ?? '10');
  const feeBps = Math.round(winningBid.feePercent * 100);
  const poolAddress = await deployPool(targetUsdc, 5000, feeBps);

  (invoice as any).tokenId = tokenId;
  (invoice as any).acceptedAgentName = agentName;
  (invoice as any).poolAddress = poolAddress;
  (invoice as any).status = 'funding';
  store.invoices.set(params.invoiceId, invoice);

  const hashscanUrl = `https://hashscan.io/testnet/token/${tokenId}`;
  return NextResponse.json({ tokenId, hashscanUrl, poolAddress, fromCache: false });
}
