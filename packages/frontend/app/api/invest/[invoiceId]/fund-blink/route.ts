import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { blinkInvestorDeposit } from '@/lib/blink';

// Investor funding via Blink (Base Sepolia). STUB-WITH-SEAM: the real Blink deposit runs
// on Base Sepolia (not Arc), so this is a SEPARATE rail from the Arc InvoicePool — it does
// NOT advance the on-chain pool. Today it returns the mock; the seam to wire the real
// @swype-org/deposit SDK lives in lib/blink.ts. Recorded on the invoice for the UI.
export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

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

  try {
    const result = await blinkInvestorDeposit(dollars);
    const blinkDeposits = ((invoice as any).blinkDeposits ?? []) as any[];
    (invoice as any).blinkDeposits = [
      ...blinkDeposits,
      { amountUsd: dollars, transferId: result.transferId, chainId: result.chainId, at: new Date().toISOString() },
    ];
    store.invoices.set(params.invoiceId, invoice);
    await store.flush();
    return NextResponse.json({
      status: result.status,
      amountUsd: dollars,
      transferId: result.transferId,
      chainId: result.chainId,
    });
  } catch (err) {
    console.error('[fund-blink] error:', err);
    return NextResponse.json({ error: 'Could not complete the Blink deposit. Please try again.' }, { status: 502 });
  }
}
