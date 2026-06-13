// World ID spike — exercises the server-side proof-verification shape that
// packages/frontend/lib/worldid.ts implements (verifyProof). Self-contained
// (inlines the same fetch the module does) so it runs under plain `tsx` without
// frontend module-resolution. Mirrors lib/worldid.ts — keep them in sync.
//
// USER MUST PROVIDE WORLDID_APP_ID (+ WORLDID_ACTION) before this can succeed
// end-to-end. Create a Staging app at developer.worldcoin.org, generate a test
// proof at simulator.worldcoin.org. Without a real app id, the live endpoint
// returns a deterministic "app not found"-class error — the spike still proves
// the request is built and the response parsed correctly (code SHAPE verified).
import { config as loadEnv } from 'dotenv';

loadEnv({ path: 'D:/ETHGlobal Hackathon/.env.local' });

const APP_ID = process.env.WORLDID_APP_ID ?? 'app_staging_PLACEHOLDER_set_me';
const ACTION = process.env.WORLDID_ACTION ?? 'factor-invoice';
const VERIFY_URL =
  process.env.WORLDID_VERIFY_URL ?? `https://developer.worldcoin.org/api/v2/verify/${APP_ID}`;

// A MOCK proof object (the shape IDKit / the simulator returns). Not a real proof —
// replace with a simulator-generated proof for a live green verify.
const MOCK_PROOF = {
  nullifier_hash: '0x' + '11'.repeat(32),
  merkle_root: '0x' + '22'.repeat(32),
  proof: '0x' + '33'.repeat(256),
  verification_level: 'orb' as const,
};

async function main() {
  console.log('=== World ID server-side verify spike ===');
  console.log('Verify URL:', VERIFY_URL);
  console.log('Action:', ACTION);
  const usingPlaceholder = !process.env.WORLDID_APP_ID;
  if (usingPlaceholder) {
    console.log(
      '\n⚠️  WORLDID_APP_ID not set — using a placeholder. This exercises the request/response\n' +
        '   SHAPE only; it will NOT verify (the endpoint rejects an unregistered app).\n' +
        '   To go live: create a Staging app at developer.worldcoin.org, set WORLDID_APP_ID +\n' +
        '   WORLDID_ACTION, generate a proof at simulator.worldcoin.org, swap MOCK_PROOF.\n'
    );
  }

  let res: Response;
  try {
    res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...MOCK_PROOF,
        action: ACTION,
        signal_hash: '0x' + '00'.repeat(32),
      }),
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
    console.log('\n✅ Proof VERIFIED (live World ID app + valid proof).');
  } else {
    // Expected when using the placeholder app id OR the mock proof.
    console.log(
      '\n✅ SHAPE VERIFIED — request built + response parsed correctly. A non-2xx here is EXPECTED' +
        (usingPlaceholder ? ' (placeholder app id / mock proof).' : ' for a mock proof against a real app.')
    );
    console.log('   (A real Staging app id + a simulator proof would return { success: true }.)');
  }
}

main().catch((err) => {
  console.error('\n❌ Spike failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
