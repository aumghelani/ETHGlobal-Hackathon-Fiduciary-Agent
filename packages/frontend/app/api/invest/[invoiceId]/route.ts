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

  const pool = await getPoolState(poolAddress);

  // Private deposits live in the store. Surface the SUM and the COUNT only —
  // never the per-investor amounts (privacy: would leak in dev tools).
  const privateDeposits = ((invoice as any).privateDeposits ?? []) as Array<{ amountUsd: number }>;
  const privateRaisedUsd = privateDeposits.reduce((s, p) => s + p.amountUsd, 0);
  const privateInvestorCount = privateDeposits.length;

  // Public deposits go straight to the InvoicePool (not tracked per-investor in
  // the store); count as one public participant when the pool has any funding.
  const publicMappedUsd = net * (pool.raised / pool.target);
  const publicInvestorCount = pool.raised > 0 ? 1 : 0;

  const displayedTotalUsd = publicMappedUsd + privateRaisedUsd;

  return NextResponse.json({
    clientName: (invoice as any).clientName,
    amountUsd: invoice.amountUsd,
    daysUntilDue: invoice.daysUntilDue,
    netToFreelancer: winningBid?.netToFreelancer ?? null,
    agentName: (invoice as any).acceptedAgentName ?? null,
    feePercent: winningBid?.feePercent ?? null,
    pool,
    privateRaisedUsd,
    displayedTotalUsd,
    publicInvestorCount,
    privateInvestorCount,
  });
}
