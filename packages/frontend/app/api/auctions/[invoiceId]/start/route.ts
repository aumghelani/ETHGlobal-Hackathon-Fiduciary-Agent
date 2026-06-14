import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { generateBid } from '@fiduciary/agents';

// Generates competing LLM agent bids (multiple model calls) — can exceed Vercel's
// default 10s function limit. 60s is the Hobby ceiling.
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
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

  // Fire both bids in parallel — this is the key parallelism for the live feel.
  // generateBid already falls back to deterministic reasoning on LLM failure, but wrap
  // the whole thing so an unexpected throw returns a JSON error, never an empty 500
  // (the auction is the demo's hero moment — it must not white-screen).
  let bids;
  try {
    const [veteranBid, newbieBid] = await Promise.all([
      generateBid(invoice, veteran),
      generateBid(invoice, newbie),
    ]);
    bids = [veteranBid, newbieBid].filter((b): b is NonNullable<typeof b> => b !== null);
  } catch (err) {
    console.error('[auction/start] bid generation failed:', err);
    return NextResponse.json(
      { error: 'Could not run the auction. Please try again.' },
      { status: 502 }
    );
  }
  store.bids.set(params.invoiceId, bids);
  await store.flush();

  return NextResponse.json({ bids, fromCache: false });
}

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
  const bids = store.bids.get(params.invoiceId) || [];
  return NextResponse.json({ bids });
}
