// One-off: register the Circle entity secret with Circle (required before the
// developer-controlled wallets API will accept signing requests). Reads the secret +
// API key FROM packages/frontend/.env.local — never hardcoded. Saves the returned
// recovery file so the entity secret can be recovered if lost. Run ONCE.
//
//   corepack pnpm@8.15.0 exec tsx scripts/register-circle-entity-secret.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';

function loadEnvLocal(): Record<string, string> {
  const p = resolve(process.cwd(), 'packages/frontend/.env.local');
  const env: Record<string, string> = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.CIRCLE_AGENT_API_KEY;
  const entitySecret = env.CIRCLE_AGENT_ENTITY_SECRET;
  if (!apiKey || !entitySecret) {
    console.error('❌ CIRCLE_AGENT_API_KEY / CIRCLE_AGENT_ENTITY_SECRET missing in packages/frontend/.env.local');
    process.exit(1);
  }

  console.log('Registering entity secret with Circle…');
  try {
    const res = await registerEntitySecretCiphertext({ apiKey, entitySecret });
    const recoveryFile = (res as any)?.data?.recoveryFile;
    if (recoveryFile) {
      const out = resolve(process.cwd(), 'circle-entity-secret-recovery.dat');
      writeFileSync(out, recoveryFile, 'utf8');
      console.log(`\n✅ Registered. Recovery file saved to: ${out}`);
      console.log('   (Keep this safe — it recovers the entity secret. It is gitignored.)');
    } else {
      console.log('\n✅ Registered (no recovery file returned in response).');
    }
  } catch (err: any) {
    // "entity secret already registered" is fine on a re-run.
    const msg = err?.message ?? String(err);
    if (/already.*regist/i.test(msg)) {
      console.log('\n✅ Entity secret was already registered (idempotent — nothing to do).');
      return;
    }
    console.error('\n❌ Registration failed:', msg);
    process.exit(1);
  }
}

main();
