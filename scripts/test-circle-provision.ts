// Live test: provision a real Circle developer-controlled wallet for "veteran-agent"
// on Arc testnet, using the registered entity secret. Reads creds from .env.local.
//   corepack pnpm@8.15.0 exec tsx scripts/test-circle-provision.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(resolve(process.cwd(), 'packages/frontend/.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const client = initiateDeveloperControlledWalletsClient({
    apiKey: env.CIRCLE_AGENT_API_KEY,
    entitySecret: env.CIRCLE_AGENT_ENTITY_SECRET,
  });

  console.log('Creating wallet set "fiduciary-veteran-agent"…');
  const setRes = await client.createWalletSet({ name: 'fiduciary-veteran-agent' });
  const walletSetId = setRes.data!.walletSet.id;
  console.log('  walletSetId:', walletSetId);

  console.log('Creating 1 EOA wallet on ARC-TESTNET…');
  const walletsRes = await client.createWallets({
    blockchains: ['ARC-TESTNET' as any],
    count: 1,
    walletSetId,
  });
  const w = walletsRes.data!.wallets[0];
  console.log('\n✅ Wallet provisioned on Arc:');
  console.log('   walletId :', w.id);
  console.log('   address  :', w.address);
  console.log('   blockchain:', (w as any).blockchain, '| state:', (w as any).state);
}

main().catch((err) => {
  console.error('\n❌ Provision failed:', err?.response?.data ?? err?.message ?? err);
  process.exit(1);
});
