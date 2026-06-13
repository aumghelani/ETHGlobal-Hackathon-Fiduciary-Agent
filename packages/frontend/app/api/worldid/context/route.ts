import { NextResponse } from 'next/server';
import { signRequest } from '@worldcoin/idkit-server';

// World ID 4.0 RP-context signer. The IDKitRequestWidget needs a signed `rp_context`
// (rp_id + nonce + timestamps + the RP's ECDSA signature). The signing key is a SECRET
// and must never reach the browser — so the widget fetches the context from here, and
// this route signs it server-side with WORLDID_SIGNING_KEY.
//
// Returns 503 (not 500) if World ID isn't configured, so the upload page can degrade
// gracefully instead of erroring.
export async function GET() {
  const rpId = process.env.WORLDID_RP_ID;
  const signingKeyHex = process.env.WORLDID_SIGNING_KEY;
  const action = process.env.WORLDID_ACTION ?? 'factor-invoice';

  if (!rpId || !signingKeyHex) {
    return NextResponse.json({ error: 'World ID not configured' }, { status: 503 });
  }

  try {
    const sig = signRequest({ signingKeyHex, action });
    // Map the idkit-server RpSignature → the rp_context shape the widget expects.
    return NextResponse.json({
      rp_context: {
        rp_id: rpId,
        nonce: sig.nonce,
        created_at: sig.createdAt,
        expires_at: sig.expiresAt,
        signature: sig.sig,
      },
    });
  } catch (err) {
    console.error('[worldid/context] sign error:', err);
    return NextResponse.json({ error: 'Could not prepare verification.' }, { status: 502 });
  }
}
