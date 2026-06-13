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

  const body = await req.json();
  const amountUsd = Number(body.amountUsd);
  if (!(amountUsd > 0)) {
    return NextResponse.json({ error: 'amountUsd must be greater than zero' }, { status: 400 });
  }

  const { txHash } = await fundPool(poolAddress, amountUsd);
  const pool = await getPoolState(poolAddress);

  return NextResponse.json({ txHash, pool });
}
