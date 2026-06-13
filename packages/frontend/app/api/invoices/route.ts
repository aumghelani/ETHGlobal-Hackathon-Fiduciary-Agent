import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { randomUUID } from 'crypto';
import { submitInvoiceHash, isHashAlreadySubmitted } from '@fiduciary/hedera';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Minimal validation — for MVP
  if (!body.clientName || !body.amountUsd || !body.daysUntilDue) {
    return NextResponse.json(
      { error: 'Missing required fields: clientName, amountUsd, daysUntilDue' },
      { status: 400 }
    );
  }

  // HCS double-spend prevention (THREAT_MODEL Layer 3). Before creating the
  // invoice, reject any file hash already committed to the shared topic; otherwise
  // commit this hash and record where it landed. The duplicate-check fails OPEN
  // (mirror-node flakiness never blocks a legitimate upload); a submit failure
  // also never blocks the upload — we just leave the hcs fields null and log it.
  const invoiceHash: string | null = body.invoiceHash ?? null;
  let hcsSequenceNumber: number | null = null;
  let hcsConsensusTimestamp: string | null = null;

  if (invoiceHash) {
    try {
      if (await isHashAlreadySubmitted(invoiceHash)) {
        return NextResponse.json(
          { error: 'This invoice has already been factored on another platform.' },
          { status: 409 }
        );
      }
    } catch (err) {
      // isHashAlreadySubmitted already fails open internally; this is belt-and-braces.
      console.error('[invoices] duplicate-check error (allowing upload):', err);
    }

    try {
      const r = await submitInvoiceHash(invoiceHash);
      hcsSequenceNumber = r.sequenceNumber;
      hcsConsensusTimestamp = r.consensusTimestamp;
    } catch (err) {
      console.error('[invoices] HCS submit failed (creating invoice anyway):', err);
    }
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
    invoiceHash,  // SHA-256 file hash committed to HCS (THREAT_MODEL Layer 3)
    hcsSequenceNumber,  // topic sequence number of the committed hash (null if submit failed)
    hcsConsensusTimestamp,  // consensus timestamp of the committed hash (null if submit failed)
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
