// World ID 4.0 server-side proof verification (proof-of-personhood, THREAT_MODEL Layer 1).
//
// v4 model (the current World ID): the frontend IDKitRequestWidget produces an IDKitResult
// (protocol_version "4.0", responses[]); the backend forwards it AS-IS to the Developer
// Portal v4 verify endpoint, which confirms the proof is cryptographically valid. This module
// only validates the proof and surfaces the nullifier; nullifier UNIQUENESS (one invoice per
// human, Sybil resistance) is enforced by the caller in app/api/invoices/route.ts, which
// rejects a nullifier already recorded in the store.
//
// Requires WORLDID_RP_ID (the registered RP id). The signing of each request's rp_context
// happens separately in /api/worldid/context (needs WORLDID_SIGNING_KEY). See lib/worldidSign.
import { withRetry } from './retry';

// The raw IDKit v4 result payload (forwarded as-is). Kept loose because we don't remap it,
// but the fields the verify endpoint REQUIRES (action, environment, responses) mirror
// @worldcoin/idkit-core's IDKitResultV4 so a malformed payload is caught before the fetch.
// `environment` ("production" | "staging") rides inside this payload — it's what tells World
// whether to accept simulator proofs, set by the IDKitRequestWidget's `environment` prop.
export type WorldIdResult = {
  protocol_version?: string;
  nonce?: string;
  action?: string;
  environment?: 'production' | 'staging' | string;
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
  // The nullifier the caller stores + checks for one-human-per-action uniqueness (when present).
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
      // Normalize the nullifier before it's used as a uniqueness key. World's docs warn that
      // raw hex casing differences ("0xAB" vs "0xab") can let the SAME human slip past a
      // uniqueness check — so we lower-case it here, at the single point it enters our system.
      const nullifier = result.responses?.[0]?.nullifier?.toLowerCase();
      return { success: true, nullifier };
    }

    const err = (await res.json().catch(() => ({}))) as { code?: string; detail?: string };
    return { success: false, code: err.code, detail: err.detail };
  });
}
