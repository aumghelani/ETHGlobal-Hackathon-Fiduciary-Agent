import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState } from '@/lib/arc';
import { privateDepositOnUnlink } from '@/lib/unlink';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const poolAddress = (invoice as any).poolAddress as string | undefined;
  if (!poolAddress) {
    return NextResponse.json({ error: 'Invoice not yet accepted' }, { status: 409 });
  }

  const body = await req.json();
  const dollars = Number(body.amountUsd);
  if (!(dollars > 0)) {
    return NextResponse.json({ error: 'Enter an amount greater than zero.' }, { status: 400 });
  }

  const bids = store.bids.get(params.invoiceId) || [];
  const winningBid = bids.find(b => b.agentName === (invoice as any).acceptedAgentName);
  const net = winningBid?.netToFreelancer ?? invoice.amountUsd;

  const before = await getPoolState(poolAddress);
  const privateDeposits = ((invoice as any).privateDeposits ?? []) as Array<{ amountUsd: number }>;
  const privateRaisedUsd = privateDeposits.reduce((s, p) => s + p.amountUsd, 0);
  const publicMappedUsd = net * (before.raised / before.target);
  const displayedTotalUsd = publicMappedUsd + privateRaisedUsd;

  // Remaining against the COMBINED displayed total (public + private). No top-off:
  // private money never fills the on-chain pool, so reject overshoot outright.
  const remainingDollars = Math.max(0, net - displayedTotalUsd);
  const cap = Math.ceil(remainingDollars);
  if (dollars > cap) {
    return NextResponse.json(
      { error: `Only $${cap.toLocaleString()} more available for funding.` },
      { status: 400 }
    );
  }

  // Same dollars→USDC mapping as the public route (consistency across paths).
  const mappedUsdc = (dollars / net) * before.target;
  const amountUsdc = BigInt(Math.round(mappedUsdc * 1_000_000));
  if (amountUsdc <= 0n) {
    const minDollars = Math.max(0.01, net / (before.target * 1_000_000)).toFixed(2);
    return NextResponse.json(
      { error: `Amount too small — try $${minDollars} or more.` },
      { status: 400 }
    );
  }

  const { txHash } = await privateDepositOnUnlink({ amountUsdc });

  (invoice as any).privateDeposits = [
    ...privateDeposits,
    { amountUsd: dollars, amountUsdc: amountUsdc.toString(), txHash, depositedAt: new Date().toISOString() },
  ];
  store.invoices.set(params.invoiceId, invoice);

  const totalRaisedUsd = publicMappedUsd + privateRaisedUsd + dollars;
  return NextResponse.json({ txHash, totalRaisedUsd });
}
