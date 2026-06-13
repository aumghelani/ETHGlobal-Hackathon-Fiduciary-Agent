import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  // Surface the (public) HCS topic id so pages can build the audit-log attribution link.
  return NextResponse.json({ invoice, hcsTopicId: process.env.HEDERA_HCS_TOPIC_ID ?? null });
}
