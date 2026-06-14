import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { fundPool, getPoolState } from '@/lib/arc';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const poolAddress = (invoice as any).poolAddress as string | undefined;
  if (!poolAddress) {
    return NextResponse.json({ error: 'Invoice not yet accepted' }, { status: 409 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const dollars = Number(body?.amountUsd);
  if (!(dollars > 0)) {
    return NextResponse.json({ error: 'Enter an amount greater than zero.' }, { status: 400 });
  }

  const bids = store.bids.get(params.invoiceId) || [];
  const winningBid = bids.find(b => b.agentName === (invoice as any).acceptedAgentName);
  const net = winningBid?.netToFreelancer ?? invoice.amountUsd;
  if (!(net > 0)) {
    return NextResponse.json({ error: 'This invoice cannot be funded.' }, { status: 409 });
  }

  let before;
  try {
    before = await getPoolState(poolAddress);
  } catch {
    return NextResponse.json(
      { error: 'Could not complete the deposit. Please try again.' },
      { status: 502 }
    );
  }
  if (!(before.target > 0)) {
    return NextResponse.json({ error: 'This invoice cannot be funded.' }, { status: 409 });
  }
  const remainingUsdc = before.target - before.raised;
  if (remainingUsdc <= 0) {
    return NextResponse.json(
      { error: 'Already fully funded — Maria has been paid.' },
      { status: 409 }
    );
  }

  // Cap against the on-chain pool only. Private (Unlink) deposits ALSO top up the pool
  // (ADR-024), so before.raised already reflects private money — don't subtract it again
  // (that would double-count). This keeps the displayed total ≤ net AND lets the pool fill.
  const remainingDollars = net * (1 - before.raised / before.target);
  const cap = Math.ceil(remainingDollars);
  if (dollars > cap) {
    return NextResponse.json(
      { error: `You can fund up to $${cap.toLocaleString()} more.` },
      { status: 400 }
    );
  }

  // Dollars in, dollars out — map to the pool's small on-chain amount here (invisible to the user).
  // If the mapped deposit reaches/exceeds remaining capacity, snap to exactly the remaining so the
  // pool hits target (release fires) despite dollar↔USDC rounding drift.
  const mappedUsdc = (dollars / net) * before.target;
  const depositUsdc = mappedUsdc >= remainingUsdc ? remainingUsdc : mappedUsdc;
  if (Math.round(depositUsdc * 1_000_000) <= 0) {
    const minDollars = Math.max(0.01, net / (before.target * 1_000_000)).toFixed(2);
    return NextResponse.json(
      { error: `Amount too small — try $${minDollars} or more.` },
      { status: 400 }
    );
  }

  let txHash: string;
  let pool;
  try {
    ({ txHash } = await fundPool(poolAddress, depositUsdc));
    pool = await getPoolState(poolAddress);
  } catch {
    return NextResponse.json(
      { error: 'Could not complete the deposit. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ txHash, pool });
}
