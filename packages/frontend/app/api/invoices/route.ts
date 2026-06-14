import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { randomUUID } from 'crypto';
import { submitInvoiceHash, isHashAlreadySubmitted } from '@fiduciary/hedera';
import { verifyProof } from '@/lib/worldid';
import { dueInDays } from '@/lib/dueDate';

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

  // World ID 4.0 identity gate (THREAT_MODEL Layer 1 — Sybil resistance on the supply
  // side). ONLY enforced when WORLDID_RP_ID is configured. Without it we degrade
  // gracefully (demo mode) so the flow never breaks. When configured, a valid v4
  // proof-of-personhood is REQUIRED to create an invoice; the result is forwarded as-is.
  //
  // DEMO_BYPASS_WORLDID=true skips the proof check so the full upload→auction flow can be
  // demoed WITHOUT a real World ID account (generating a genuine proof needs the World App
  // + Orb). The integration stays real for anyone who CAN verify; this is an explicit,
  // opt-in demo escape hatch (default OFF). Logged loudly so it's never a silent bypass.
  const bypassWorldId = process.env.DEMO_BYPASS_WORLDID === 'true';
  if (bypassWorldId && process.env.WORLDID_RP_ID) {
    console.warn('[invoices] ⚠️  DEMO_BYPASS_WORLDID active — World ID proof check SKIPPED.');
  }
  const store = await getStore();
  // Captured from a successful World ID verify, recorded only once the invoice is created.
  let verifiedNullifier: string | undefined;
  if (process.env.WORLDID_RP_ID && !bypassWorldId) {
    const r = body.worldIdResult;
    if (!r?.responses?.length && !r?.protocol_version) {
      return NextResponse.json(
        { error: 'Identity verification required. Please verify with World ID and try again.' },
        { status: 403 }
      );
    }
    let nullifier: string | undefined;
    try {
      const result = await verifyProof(r);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Identity verification failed. Please verify with World ID and try again.' },
          { status: 403 }
        );
      }
      nullifier = result.nullifier;
    } catch (err) {
      console.error('[invoices] World ID verify error:', err);
      return NextResponse.json(
        { error: 'Could not verify identity right now. Please try again.' },
        { status: 502 }
      );
    }

    // Personhood-bound reputation (THREAT_MODEL Layer 1). The action is fixed
    // (factor-invoice), so World ID returns the SAME nullifier for the same human every
    // time. We do NOT block a repeat — a freelancer legitimately factors MANY invoices.
    // Instead we bind every invoice to this one human identity (below), so their track
    // record follows the HUMAN and can't be reset by switching wallets. Without this, the
    // whole reputation/trust system is defeatable: a freelancer with a bad dispute history
    // just makes a fresh wallet and underwrites clean again. That is what World ID prevents.
    if (!nullifier) {
      // A valid v4 proof must carry a nullifier; its absence means we can't bind reputation
      // to a real human, so fail closed rather than admit an untracked identity.
      console.error('[invoices] verified proof had no nullifier — rejecting (fail closed).');
      return NextResponse.json(
        { error: 'Identity verification incomplete. Please verify with World ID and try again.' },
        { status: 403 }
      );
    }
    verifiedNullifier = nullifier;
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

  // This human's existing reputation (by World ID nullifier), if we've seen them before.
  // Their factoring history follows the HUMAN, so a freelancer's track record (and any
  // disputes) carries across every invoice they submit — and can't be reset with a new wallet.
  const prior = verifiedNullifier ? store.nullifiers.get(verifiedNullifier) : undefined;

  // Freelancer trust data. The dynamic fields are derived from this human's bound history
  // (verifiedNullifier) so reputation is personhood-anchored; the rest are demo defaults.
  const invoice = {
    id,
    amountUsd: body.amountUsd,
    currency: ['USD', 'EUR', 'GBP'].includes(body.currency) ? body.currency : 'USD',
    daysUntilDue: body.daysUntilDue,
    // World ID nullifier this invoice is bound to (null when the gate is bypassed for demos).
    worldIdNullifier: verifiedNullifier ?? null,
    // Connected wallet that created this invoice (for "my history"). Null if not sent.
    createdByAddress: typeof body.freelancerAddress === 'string' ? body.freelancerAddress : null,
    freelancer: {
      identityVerified: !!verifiedNullifier,
      ensSubname: 'maria.fid.eth',
      // Successful history = invoices this HUMAN has already factored (personhood-bound),
      // plus a demo baseline. Disputes likewise follow the human and can't be washed away.
      successfulInvoices: 5 + (prior?.invoicesFactored ?? 0),
      disputedInvoices: prior?.disputes ?? 0,
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
  // Accrue this invoice to the human's personhood-bound reputation (create the record on
  // first sight, otherwise increment). This is the load-bearing bit: the count grows with
  // the HUMAN across every wallet they use, so a bad track record can't be escaped. Recorded
  // after creation so an upstream rejection doesn't dirty their history.
  if (verifiedNullifier) {
    store.nullifiers.set(verifiedNullifier, {
      firstSeenAt: prior?.firstSeenAt ?? new Date().toISOString(),
      invoicesFactored: (prior?.invoicesFactored ?? 0) + 1,
      disputes: prior?.disputes ?? 0,
    });
  }
  await store.flush(); // ensure the writes land before the serverless function returns

  return NextResponse.json({ id, invoice }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const store = await getStore();
  // The viewer's connected wallet (lower-cased), passed as ?me=0x... by the client. Used to
  // reveal a PRIVATE investment's amount ONLY to the wallet that made it — everyone else
  // still gets it nulled. This keeps private deposits sealed from other investors while
  // letting an investor see their own history.
  const meParam = new URL(req.url).searchParams.get('me');
  const me = meParam ? meParam.toLowerCase() : null;
  // Enrich each invoice with its accepted agent's fee% (from the winning bid) so the
  // marketplace can show an indicative yield without an extra fetch per card.
  const invoices = Array.from(store.invoices.entries()).map(([id, inv]) => {
    const acceptedName = (inv as any).acceptedAgentName;
    const winningBid = acceptedName
      ? (store.bids.get(id) || []).find((b) => b.agentName === acceptedName)
      : undefined;
    // Sanitize investments for the client. Public deposit amounts are visible to everyone.
    // A PRIVATE deposit's amount is revealed ONLY to the wallet that made it (me === its
    // address); to every other viewer it is nulled, so private positions stay sealed while
    // an investor can still see their own private history.
    const rawInvestments = (((inv as any).investments ?? []) as Array<any>);
    const investments = rawInvestments.map((iv) => {
      const ownedByMe = !!me && typeof iv.address === 'string' && iv.address.toLowerCase() === me;
      return {
        address: iv.address ?? null,
        amountUsd: iv.private && !ownedByMe ? null : iv.amountUsd,
        private: !!iv.private,
        at: iv.at,
      };
    });
    // Strip privacy-sensitive raw fields before spreading: private deposit amounts (Unlink
    // privacy), the per-invoice blink amounts, and the World ID nullifier (a stable
    // personhood id that must not be broadcast). The sanitized `investments` above is what
    // the client gets instead.
    const {
      privateDeposits: _pd,
      blinkDeposits: _bd,
      worldIdNullifier: _nu,
      investments: _inv,
      ...safe
    } = inv as any;
    return {
      ...safe,
      feePercent: winningBid?.feePercent ?? null,
      agentEarnings: winningBid?.agentEarnings ?? null,
      // Net advanced to the freelancer = what investors actually fund against (the dashboard
      // uses this as the denominator for each investor's proportional payout).
      netToFreelancer: winningBid?.netToFreelancer ?? null,
      // Live days-until-due (counts down from the original term), so the UI never shows a
      // frozen "60 days" on an aging or settled invoice.
      dueInDays: dueInDays((inv as any).createdAt, (inv as any).daysUntilDue),
      investments,
    };
  });
  return NextResponse.json({ invoices });
}
