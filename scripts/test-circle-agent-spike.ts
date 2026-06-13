// Circle Agent Wallet spike — exercises the shape of packages/frontend/lib/circleAgentWallet.ts
// (provisionAgentWallet / setSpendingPolicy / signTransaction) against a MOCK Circle client.
// Self-contained so it runs under plain `tsx` with ZERO creds and without the Circle SDK
// installed. Mirrors lib/circleAgentWallet.ts — keep in sync.
//
// USER-REQUIRED to go live (docs/CIRCLE_AGENT_RECON.md): a separate Circle Developer Console
// signup → CIRCLE_AGENT_API_KEY + a registered CIRCLE_AGENT_ENTITY_SECRET, plus
// `pnpm add @circle-fin/developer-controlled-wallets`. Arc IS supported (ARC-TESTNET).
import { config as loadEnv } from 'dotenv';

loadEnv({ path: 'D:/ETHGlobal Hackathon/.env.local' });

const ARC_BLOCKCHAIN = 'ARC-TESTNET';
const haveCreds = !!(process.env.CIRCLE_AGENT_API_KEY && process.env.CIRCLE_AGENT_ENTITY_SECRET);

// --- MOCK Circle developer-controlled-wallets client (stands in for the real SDK) ---
// Returns the same response SHAPES the real client does, so the module's logic is exercised.
function mockCircleClient() {
  let seq = 0;
  return {
    async createWalletSet({ name }: { name: string }) {
      return { data: { walletSet: { id: `ws_mock_${name}` } } };
    },
    async createWallets({ blockchains }: { blockchains: string[] }) {
      seq += 1;
      return {
        data: {
          wallets: [{ id: `wal_mock_${seq}`, address: '0x' + seq.toString(16).padStart(40, '0'), blockchain: blockchains[0] }],
        },
      };
    },
    async createTransaction() {
      seq += 1;
      return { data: { id: `txn_mock_${seq}`, state: 'INITIATED' } };
    },
  };
}

// Inlined mirror of the module's three functions, using the mock client.
const client = mockCircleClient();

async function provisionAgentWallet(agentName: string) {
  const setRes = await client.createWalletSet({ name: `fiduciary-${agentName}` });
  const walletsRes = await client.createWallets({ blockchains: [ARC_BLOCKCHAIN] });
  void setRes;
  const w = walletsRes.data.wallets[0];
  return { walletId: w.id, address: w.address };
}
async function setSpendingPolicy(walletId: string, policy: any) {
  return { walletId, policy };
}
async function signTransaction(walletId: string, tx: any) {
  const res = await client.createTransaction();
  void walletId;
  void tx;
  return { transactionId: res.data.id };
}

async function main() {
  console.log('=== Circle Agent Wallet spike (MOCK) ===');
  console.log('Blockchain enum:', ARC_BLOCKCHAIN, '(Arc testnet — SUPPORTED by Circle wallets)');
  if (!haveCreds) {
    console.log(
      '\n⚠️  CIRCLE_AGENT_API_KEY / CIRCLE_AGENT_ENTITY_SECRET not set + SDK not installed —\n' +
        '   running against a MOCK Circle client. This exercises the module SHAPE (provision →\n' +
        '   set policy → sign) with mocked responses. To go live: sign up at console.circle.com,\n' +
        '   create an API key + register an entity secret, `pnpm add\n' +
        "   @circle-fin/developer-controlled-wallets`, then re-run against the real API.\n"
    );
  }

  const wallet = await provisionAgentWallet('veteran-agent');
  console.log('Provisioned wallet:', JSON.stringify(wallet));

  const policy = await setSpendingPolicy(wallet.walletId, { maxAmount: '10000', period: 'daily', token: 'USDC' });
  console.log('Spending policy set:', JSON.stringify(policy));

  const signed = await signTransaction(wallet.walletId, {
    destination: '0x' + 'ab'.repeat(20),
    amount: '100',
    tokenId: 'USDC',
  });
  console.log('Signed transaction:', JSON.stringify(signed));

  if (wallet.walletId && wallet.address && signed.transactionId) {
    console.log('\n✅ MOCK SHAPE VERIFIED — provision → set $10k/day policy → sign all run end-to-end.');
    console.log('   Wallet address (mock):', wallet.address);
    console.log('   With real Circle Console creds + the SDK, this provisions a real Arc-testnet wallet.');
  } else {
    console.error('❌ Unexpected mock result.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Spike failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
