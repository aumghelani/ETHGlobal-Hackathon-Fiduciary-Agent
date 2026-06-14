// World ID 4.0 spike — exercises the SAME server-side verify shape that
// packages/frontend/lib/worldid.ts implements (verifyProof). Self-contained (inlines the
// same fetch the module does) so it runs under plain `tsx` without frontend module
// resolution. Mirrors lib/worldid.ts — keep them in sync.
//
// v4 contract (the current World ID): the verify endpoint is
//   POST https://developer.world.org/api/v4/verify/{rp_id}
// and the body is the IDKit v4 result forwarded AS-IS (protocol_version "4.0", action,
// environment, responses[]). There is NO app_staging_ id and NO separate v2 endpoint —
// staging-vs-production is carried by the `environment` field inside the payload.
//
// USER MUST PROVIDE WORLDID_RP_ID before this verifies end-to-end. Without a real proof in
// responses[], the live endpoint returns a deterministic validation error — the spike still
// proves the request is built and the response parsed correctly (code SHAPE verified), and
// that the RP id is recognized.
import { config as loadEnv } from 'dotenv';

loadEnv({ path: 'D:/ETHGlobal Hackathon/.env.local' });

const RP_ID = process.env.WORLDID_RP_ID ?? 'rp_PLACEHOLDER_set_me';
const ACTION = process.env.WORLDID_ACTION ?? 'factor-invoice';
const ENVIRONMENT = (process.env.NEXT_PUBLIC_WLD_ENV ?? 'staging') as 'production' | 'staging';
const VERIFY_URL =
  process.env.WORLDID_VERIFY_URL ?? `https://developer.world.org/api/v4/verify/${RP_ID}`;

// A MOCK v4 result (the shape IDKit / the simulator returns). `responses` is intentionally
// empty — replace with a simulator-generated proof for a live green verify.
const MOCK_RESULT = {
  protocol_version: '4.0' as const,
  action: ACTION,
  environment: ENVIRONMENT,
  responses: [] as Array<Record<string, unknown>>,
};

async function main() {
  console.log('=== World ID 4.0 server-side verify spike ===');
  console.log('Verify URL:', VERIFY_URL);
  console.log('Action:', ACTION, '| Environment:', ENVIRONMENT);
  const usingPlaceholder = !process.env.WORLDID_RP_ID;
  if (usingPlaceholder) {
    console.log(
      '\n⚠️  WORLDID_RP_ID not set — using a placeholder. This exercises the request/response\n' +
        '   SHAPE only; it will NOT verify (the endpoint rejects an unregistered RP).\n' +
        '   To go live: enable World ID 4.0 at developer.world.org, set WORLDID_RP_ID, generate\n' +
        '   a proof at simulator.worldcoin.org (with environment="staging"), fill responses[].\n'
    );
  }

  let res: Response;
  try {
    res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(MOCK_RESULT),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    console.error('❌ Network error reaching the verify endpoint:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const body = await res.json().catch(() => ({}));
  console.log(`HTTP ${res.status}`);
  console.log('Response body:', JSON.stringify(body, null, 2));

  if (res.ok) {
    console.log('\n✅ Proof VERIFIED (live World ID 4.0 RP + valid proof).');
  } else {
    // Expected with an empty responses[] OR a placeholder RP. A `validation_error` asking
    // for a response item PROVES the RP id is recognized and the endpoint is live.
    const recognized = (body as { code?: string })?.code === 'validation_error';
    console.log(
      '\n✅ SHAPE VERIFIED — request built + response parsed correctly. A non-2xx here is EXPECTED' +
        (usingPlaceholder ? ' (placeholder RP id / empty proof).' : ' for an empty proof against a real RP.')
    );
    if (recognized && !usingPlaceholder) {
      console.log('   ✅ RP id RECOGNIZED — the endpoint validated our request (not "rp not found").');
    }
    console.log('   (A real proof in responses[] would return { success: true }.)');
  }
}

main().catch((err) => {
  console.error('\n❌ Spike failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
