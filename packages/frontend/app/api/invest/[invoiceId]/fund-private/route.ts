import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState, fundPool } from '@/lib/arc';
import { privateDepositOnUnlink } from '@/lib/unlink';

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
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
      { error: 'Could not complete the private deposit. Please try again.' },
      { status: 502 }
    );
  }
  if (!(before.target > 0)) {
    return NextResponse.json({ error: 'This invoice cannot be funded.' }, { status: 409 });
  }
  const privateDeposits = ((invoice as any).privateDeposits ?? []) as Array<{ amountUsd: number }>;
  // Cap against the on-chain pool only — private deposits ALSO top up the pool (ADR-024),
  // so before.raised already reflects all prior funding (public + private). Don't add
  // private again (double-count).
  const poolMappedUsd = net * (before.raised / before.target);
  const remainingDollars = Math.max(0, net - poolMappedUsd);
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

  let txHash: string;
  try {
    ({ txHash } = await privateDepositOnUnlink({ amountUsdc }));
  } catch {
    return NextResponse.json(
      { error: 'Could not complete the private deposit. Please try again.' },
      { status: 502 }
    );
  }

  // Reflect the SAME amount into the on-chain Arc pool so the pool can reach target and
  // settle() works (the contract requires on-chain funded==true; private money alone never
  // fills it). Per-investor who/how-much stays private — only the AGGREGATE moves on-chain.
  // Best-effort: a top-up failure doesn't undo the recorded private deposit. ADR-024.
  // Snap to the pool's remaining capacity to avoid over-depositing past target.
  let poolTopUpTxHash: string | null = null;
  try {
    const remainingUsdc = before.target - before.raised;
    const wantUsdc = Number(amountUsdc) / 1_000_000;
    const depositUsdc = Math.min(wantUsdc, remainingUsdc);
    if (depositUsdc > 0 && Math.round(depositUsdc * 1_000_000) > 0) {
      ({ txHash: poolTopUpTxHash } = await fundPool(poolAddress, depositUsdc));
    }
  } catch (err) {
    console.error('[fund-private] on-chain pool top-up failed (non-fatal):', err);
  }

  (invoice as any).privateDeposits = [
    ...privateDeposits,
    {
      amountUsd: dollars,
      amountUsdc: amountUsdc.toString(),
      txHash,
      poolTopUpTxHash,
      depositedAt: new Date().toISOString(),
    },
  ];
  store.invoices.set(params.invoiceId, invoice);
  await store.flush();

  // The pool now reflects this deposit too; the client refreshes for the exact figure.
  const totalRaisedUsd = Math.min(net, poolMappedUsd + dollars);
  return NextResponse.json({ txHash, totalRaisedUsd });
}
