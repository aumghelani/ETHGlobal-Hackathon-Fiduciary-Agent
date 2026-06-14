import { NextRequest, NextResponse } from 'next/server';
import { verifyInvestor, isKycEnabled, isKycBypassed } from '@/lib/kyc';

// Investor KYC/accreditation check. Runs server-side so a real provider's key (when
// wired) stays off the client. Returns the verification result; the /invest page gates
// the fund action on success. When KYC is disabled or bypassed, returns a pass so the
// demo flow is never blocked.
export async function POST(req: NextRequest) {
  if (!isKycEnabled() || isKycBypassed()) {
    return NextResponse.json({
      verified: true,
      checks: ['Verification not required (demo)'],
      provider: 'bypass',
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine for the mock.
  }

  try {
    const result = await verifyInvestor({ reference: body?.reference });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[kyc/verify] error:', err);
    return NextResponse.json(
      { verified: false, checks: [], provider: 'mock', reason: 'Verification failed. Please try again.' },
      { status: 502 }
    );
  }
}
