import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState } from '@/lib/arc';

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const poolAddress = (invoice as any).poolAddress as string | undefined;
  if (!poolAddress) {
    return NextResponse.json({ error: 'Invoice not yet accepted' }, { status: 409 });
  }

  const bids = store.bids.get(params.invoiceId) || [];
  const winningBid = bids.find(b => b.agentName === (invoice as any).acceptedAgentName);
  const net = winningBid?.netToFreelancer ?? invoice.amountUsd;

  let pool;
  try {
    pool = await getPoolState(poolAddress);
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the payment network. Please try again.' },
      { status: 502 }
    );
  }

  // Private deposits live in the store. Surface the SUM and the COUNT only —
  // never the per-investor amounts (privacy: would leak in dev tools).
  const privateDeposits = ((invoice as any).privateDeposits ?? []) as Array<{ amountUsd: number }>;
  const privateRaisedUsd = privateDeposits.reduce((s, p) => s + p.amountUsd, 0);
  const privateInvestorCount = privateDeposits.length;

  // Public deposits go straight to the InvoicePool (not tracked per-investor in
  // the store); count as one public participant when the pool has any funding.
  // Guard target>0 (a fresh/misconfigured pool could read 0 → divide-by-zero/Infinity).
  const publicMappedUsd = pool.target > 0 ? net * (pool.raised / pool.target) : 0;
  const publicInvestorCount = pool.raised > 0 ? 1 : 0;

  // Cap at net so the UI never shows >100% funded (an over-funded pool, or public+private
  // drift, could otherwise push the displayed total past the invoice's net).
  const displayedTotalUsd = Math.min(net, publicMappedUsd + privateRaisedUsd);

  // Symbolic settled-state figures (the dollar story the UI narrates). Mirrors the
  // /settle route's split: agent earns its fee, investors receive the remainder.
  const agentEarnedUsd = winningBid?.agentEarnings ?? 0;
  const investorsReceivedUsd = invoice.amountUsd - agentEarnedUsd;

  return NextResponse.json({
    clientName: (invoice as any).clientName,
    amountUsd: invoice.amountUsd,
    daysUntilDue: invoice.daysUntilDue,
    netToFreelancer: winningBid?.netToFreelancer ?? null,
    agentName: (invoice as any).acceptedAgentName ?? null,
    feePercent: winningBid?.feePercent ?? null,
    status: (invoice as any).status ?? 'funding',
    pool,
    privateRaisedUsd,
    displayedTotalUsd,
    publicInvestorCount,
    privateInvestorCount,
    agentEarnedUsd,
    investorsReceivedUsd,
    // HCS audit attestation (THREAT_MODEL Layer 3) — null if the hash submit failed.
    // The topic ID is a public on-chain identifier (safe to expose) used to build the
    // HashScan attribution link on the landing page.
    hcsSequenceNumber: (invoice as any).hcsSequenceNumber ?? null,
    hcsTopicId: process.env.HEDERA_HCS_TOPIC_ID ?? null,
    // The agent's Circle-managed wallet on Arc (null if Circle isn't configured).
    agentWalletAddress: (invoice as any).agentWalletAddress ?? null,
  });
}
