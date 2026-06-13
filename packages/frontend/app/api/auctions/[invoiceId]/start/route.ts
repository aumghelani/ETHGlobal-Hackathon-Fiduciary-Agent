import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { generateBid } from '@fiduciary/agents';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Don't re-run auction if bids already exist
  const existing = store.bids.get(params.invoiceId);
  if (existing && existing.length > 0) {
    return NextResponse.json({ bids: existing, fromCache: true });
  }

  const veteran = store.agents.get('veteran')!;
  const newbie = store.agents.get('newbie')!;

  // Fire both bids in parallel — this is the key parallelism for the live feel
  const [veteranBid, newbieBid] = await Promise.all([
    generateBid(invoice, veteran),
    generateBid(invoice, newbie),
  ]);

  const bids = [veteranBid, newbieBid].filter((b): b is NonNullable<typeof b> => b !== null);
  store.bids.set(params.invoiceId, bids);

  return NextResponse.json({ bids, fromCache: false });
}

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const bids = store.bids.get(params.invoiceId) || [];
  return NextResponse.json({ bids });
}
