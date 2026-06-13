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

  const pool = await getPoolState(poolAddress);

  return NextResponse.json({
    clientName: (invoice as any).clientName,
    amountUsd: invoice.amountUsd,
    daysUntilDue: invoice.daysUntilDue,
    netToFreelancer: winningBid?.netToFreelancer ?? null,
    agentName: (invoice as any).acceptedAgentName ?? null,
    feePercent: winningBid?.feePercent ?? null,
    pool,
  });
}
