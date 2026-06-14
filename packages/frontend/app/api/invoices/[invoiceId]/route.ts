import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  // Strip privacy-sensitive raw fields before returning: private (Unlink) deposit amounts,
  // the World ID nullifier (a stable personhood id), and per-deposit blink amounts. The UI
  // that needs investor data uses the sanitized /api/invest/[invoiceId] route instead.
  const {
    privateDeposits: _pd,
    blinkDeposits: _bd,
    worldIdNullifier: _nu,
    investments: _inv,
    ...safe
  } = invoice as any;
  // Surface the (public) HCS topic id so pages can build the audit-log attribution link.
  return NextResponse.json({ invoice: safe, hcsTopicId: process.env.HEDERA_HCS_TOPIC_ID ?? null });
}
