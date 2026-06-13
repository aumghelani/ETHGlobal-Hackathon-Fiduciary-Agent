import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Minimal validation — for MVP
  if (!body.clientName || !body.amountUsd || !body.daysUntilDue) {
    return NextResponse.json(
      { error: 'Missing required fields: clientName, amountUsd, daysUntilDue' },
      { status: 400 }
    );
  }

  const id = randomUUID();
  const store = getStore();

  // Hardcoded freelancer + client trust data for MVP (per ADR-007, no real World ID)
  const invoice = {
    id,
    amountUsd: body.amountUsd,
    daysUntilDue: body.daysUntilDue,
    freelancer: {
      identityVerified: true,
      ensSubname: 'maria.fid.eth',
      successfulInvoices: 5,
      disputedInvoices: 0,
      totalVolumeReceived: 20000,
      averagePaymentDelay: 2,
      accountAgeInDays: 180,
      uniqueClientsCount: 2,
    },
    client: {
      isVerifiedBusiness: true,
      invoicesPaidOnTime: 8,
      invoicesPaidLate: 1,
      invoicesUnpaid: 0,
      totalVolumePaid: 50000,
      averagePaymentDelay: 3,
    },
    status: 'pending_auction' as const,
    investors: [],
    clientName: body.clientName,  // extra field for display
    createdAt: new Date().toISOString(),
  };

  store.invoices.set(id, invoice as any);

  return NextResponse.json({ id, invoice }, { status: 201 });
}

export async function GET() {
  const store = getStore();
  const invoices = Array.from(store.invoices.values());
  return NextResponse.json({ invoices });
}
