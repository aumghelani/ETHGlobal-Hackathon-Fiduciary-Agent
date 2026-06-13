// World ID server-side proof verification (proof-of-personhood, THREAT_MODEL Layer 1).
//
// ISOLATED sponsor-candidate module — NOT wired into any route yet. Built per the
// recon in docs/WORLDID_RECON.md. Our app is server-only (no wallet UI), so we verify
// the proof with a raw server-side fetch to World's Developer Portal verify endpoint —
// no React/IDKit dependency. The proof itself is produced client-side by the IDKit
// widget or the World ID simulator (simulator.worldcoin.org).
//
// USER-REQUIRED to go live: a real WORLDID_APP_ID + WORLDID_ACTION from
// developer.worldcoin.org (a human must create a Staging app). Without it the verify
// endpoint returns an "app not found" error — the module's shape is still exercised.
import { withRetry } from './retry';

export type WorldIdVerificationLevel = 'orb' | 'secure_document' | 'document' | 'device';

export interface WorldIdProof {
  proof: string;
  nullifierHash: string;
  merkleRoot: string;
  verificationLevel: WorldIdVerificationLevel;
  // The action id configured in the Developer Portal (defaults to WORLDID_ACTION).
  action?: string;
  // Optional signal bound into the proof. World hashes it into signal_hash; for a
  // raw fetch we forward signal_hash directly, so callers pass a pre-hashed value or
  // omit it. (The IDKit SDK does the poseidon hashToField; we keep the module SDK-free.)
  signalHash?: string;
}

export interface WorldIdVerifyResult {
  success: boolean;
  code?: string;
  detail?: string;
  attribute?: string | null;
  nullifierHash?: string;
}

// Verify a World ID proof against the Developer Portal cloud verify endpoint.
// Returns { success } plus the error fields on failure (never throws on a 4xx —
// only on total network failure after retries). Retried per ADR-016.
export async function verifyProof(proof: WorldIdProof): Promise<WorldIdVerifyResult> {
  const appId = process.env.WORLDID_APP_ID;
  if (!appId) {
    throw new Error(
      'Missing WORLDID_APP_ID. Create a Staging app at developer.worldcoin.org (see docs/WORLDID_RECON.md).'
    );
  }
  const action = proof.action ?? process.env.WORLDID_ACTION ?? '';
  // Endpoint base is overridable so the v4 path (developer.world.org/api/v4/verify/{rp_id})
  // can be used later without code changes. Defaults to the v2 cloud-verify endpoint.
  const base = process.env.WORLDID_VERIFY_URL ?? `https://developer.worldcoin.org/api/v2/verify/${appId}`;

  return withRetry(async () => {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nullifier_hash: proof.nullifierHash,
        merkle_root: proof.merkleRoot,
        proof: proof.proof,
        verification_level: proof.verificationLevel,
        action,
        signal_hash: proof.signalHash ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as { nullifier_hash?: string };
      return { success: true, nullifierHash: body.nullifier_hash ?? proof.nullifierHash };
    }

    // A 4xx carries World's structured error — surface it, don't throw (so a genuine
    // "invalid proof" isn't retried as if it were a transient blip).
    const err = (await res.json().catch(() => ({}))) as {
      code?: string;
      detail?: string;
      attribute?: string | null;
    };
    return { success: false, code: err.code, detail: err.detail, attribute: err.attribute ?? null };
  });
}
