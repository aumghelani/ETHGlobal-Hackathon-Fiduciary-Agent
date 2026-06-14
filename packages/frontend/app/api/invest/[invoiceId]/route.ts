import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState } from '@/lib/arc';
import { calculateFreelancerTrust } from '@fiduciary/agents';

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
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

  // The on-chain pool now reflects BOTH public and private money (private deposits also
  // top up the pool, ADR-024), so the pool-mapped dollars ARE the combined total — don't
  // add privateRaisedUsd again (double-count). Guard target>0 (avoid divide-by-zero).
  const poolMappedUsd = pool.target > 0 ? net * (pool.raised / pool.target) : 0;
  // A public participant exists when the pool has more funding than the private portion.
  const publicInvestorCount = poolMappedUsd - privateRaisedUsd > 1 ? 1 : 0;

  // Cap at net so the UI never shows >100% funded.
  const displayedTotalUsd = Math.min(net, poolMappedUsd);

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
    // Private (Unlink) payout tx if one fired at settlement (Track E) — null otherwise.
    privatePayoutTxHash: (invoice as any).privatePayoutTxHash ?? null,
    // Freelancer trust score (0-1 → shown as 0-5 for UI consistency with the agent score).
    freelancerScore: (invoice as any).freelancer
      ? Math.round(calculateFreelancerTrust((invoice as any).freelancer) * 5 * 100) / 100
      : null,
    // Display currency (settlement stays USDC under the hood).
    currency: (invoice as any).currency ?? 'USD',
    // Public pool contract address (for wallet-side funding via Dynamic).
    poolAddress,
  });
}
