// World ID 4.0 server-side proof verification (proof-of-personhood, THREAT_MODEL Layer 1).
//
// v4 model (the current World ID): the frontend IDKitRequestWidget produces an IDKitResult
// (protocol_version "4.0", responses[]); the backend forwards it AS-IS to the Developer
// Portal v4 verify endpoint, which confirms the proof is cryptographically valid. We then
// enforce nullifier uniqueness ourselves.
//
// Requires WORLDID_RP_ID (the registered RP id). The signing of each request's rp_context
// happens separately in /api/worldid/context (needs WORLDID_SIGNING_KEY). See lib/worldidSign.
import { withRetry } from './retry';

// The raw IDKit v4 result payload (forwarded as-is). Kept loose because we don't remap it.
export type WorldIdResult = {
  protocol_version?: string;
  nonce?: string;
  action?: string;
  environment?: string;
  responses?: Array<{
    identifier?: string;
    proof?: string[];
    nullifier?: string;
    issuer_schema_id?: number;
    expires_at_min?: number;
  }>;
  // v3 legacy fallback fields may also be present when allow_legacy_proofs is on.
  [k: string]: unknown;
};

export interface WorldIdVerifyResult {
  success: boolean;
  code?: string;
  detail?: string;
  // The nullifier we should store for one-human-per-action uniqueness (when present).
  nullifier?: string;
}

// Verify a World ID v4 proof by forwarding the IDKit result to the Developer Portal.
// Never throws on a 4xx (a genuine "invalid proof" shouldn't be retried as a blip) —
// only on total network failure after retries (ADR-016).
export async function verifyProof(result: WorldIdResult): Promise<WorldIdVerifyResult> {
  const rpId = process.env.WORLDID_RP_ID;
  if (!rpId) {
    throw new Error(
      'Missing WORLDID_RP_ID. Enable World ID 4.0 (Managed) at developer.world.org and copy the RP ID.'
    );
  }
  const base =
    process.env.WORLDID_VERIFY_URL ?? `https://developer.world.org/api/v4/verify/${rpId}`;

  return withRetry(async () => {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const nullifier = result.responses?.[0]?.nullifier;
      return { success: true, nullifier };
    }

    const err = (await res.json().catch(() => ({}))) as { code?: string; detail?: string };
    return { success: false, code: err.code, detail: err.detail };
  });
}
