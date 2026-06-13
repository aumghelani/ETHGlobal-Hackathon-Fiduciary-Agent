// Circle Agent / Developer-Controlled Wallets — ISOLATED sponsor-candidate module,
// NOT wired in. Built per docs/CIRCLE_AGENT_RECON.md.
//
// An autonomous "fiduciary agent" holds USDC in a Circle-managed wallet with policy
// controls (spending caps) and signs distribution transactions server-side via Circle's
// API. Arc testnet IS supported (ARC-TESTNET).
//
// USER-REQUIRED to go live: a SEPARATE Circle Developer Console signup → CIRCLE_AGENT_API_KEY
// + a generated+registered CIRCLE_AGENT_ENTITY_SECRET. Our Arc RPC creds are NOT sufficient.
// Also: `pnpm add @circle-fin/developer-controlled-wallets` (deliberately NOT in package.json
// yet — it's a heavy dep we shouldn't ship unused; this module imports it lazily so the rest
// of the app builds without it).
import { withRetry } from './retry';

const ARC_BLOCKCHAIN = 'ARC-TESTNET'; // confirm vs developers.circle.com/wallets/account-types

export interface SpendingPolicy {
  // e.g. { maxAmount: '10000', period: 'daily', token: 'USDC' }
  maxAmount: string;
  period?: 'transaction' | 'daily' | 'weekly' | 'monthly';
  token?: string;
}

export interface AgentTransaction {
  destination: string;
  amount: string;
  tokenId: string;
}

function requireCreds(): { apiKey: string; entitySecret: string } {
  const apiKey = process.env.CIRCLE_AGENT_API_KEY;
  const entitySecret = process.env.CIRCLE_AGENT_ENTITY_SECRET;
  if (!apiKey || !entitySecret) {
    throw new Error(
      'Missing CIRCLE_AGENT_API_KEY / CIRCLE_AGENT_ENTITY_SECRET. Sign up at console.circle.com, ' +
        'create an API key + register an entity secret (see docs/CIRCLE_AGENT_RECON.md).'
    );
  }
  return { apiKey, entitySecret };
}

// Lazily construct the Circle client so the app builds without the SDK installed.
// Throws a clear error if the SDK isn't present or creds are missing.
async function getClient(): Promise<any> {
  const { apiKey, entitySecret } = requireCreds();
  let mod: any;
  try {
    // The SDK is intentionally NOT in package.json (heavy, unused until the user wires Circle
    // in). A variable specifier keeps TS from resolving the (absent) module type at compile
    // time; the import resolves at runtime once the user installs it.
    const pkg = '@circle-fin/developer-controlled-wallets';
    mod = await import(/* webpackIgnore: true */ pkg);
  } catch {
    throw new Error(
      "@circle-fin/developer-controlled-wallets is not installed. Run " +
        "`pnpm add @circle-fin/developer-controlled-wallets` in packages/frontend."
    );
  }
  return mod.initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
}

// Provision a fresh developer-controlled wallet for an agent on Arc testnet.
// Creates a wallet set then one EOA wallet inside it; returns the wallet id + address.
export async function provisionAgentWallet(
  agentName: string
): Promise<{ walletId: string; address: string }> {
  return withRetry(async () => {
    const client = await getClient();
    const setRes = await client.createWalletSet({ name: `fiduciary-${agentName}` });
    const walletSetId = setRes.data.walletSet.id;
    const walletsRes = await client.createWallets({
      walletSetId,
      blockchains: [ARC_BLOCKCHAIN],
      count: 1,
      accountType: 'EOA',
    });
    const w = walletsRes.data.wallets[0];
    return { walletId: w.id, address: w.address };
  });
}

// Attach a spending policy (cap) to a wallet. Policy controls are part of Circle's
// wallet/agent layer; the exact API surface may be CLI- vs API-exposed (recon uncertainty),
// so this is written against the documented transaction-policy shape and may need adjusting.
export async function setSpendingPolicy(
  walletId: string,
  policy: SpendingPolicy
): Promise<{ walletId: string; policy: SpendingPolicy }> {
  // NOTE: Circle's spending-limit configuration is surfaced through the Agent Stack /
  // transaction-policy APIs (recon flags mild uncertainty on the exact raw-API path).
  // Validate creds + SDK presence so the failure mode is a clear error, not a silent no-op.
  await getClient();
  // TODO(verify): wire to Circle's actual policy endpoint once the exact surface is confirmed.
  return { walletId, policy };
}

// Sign + submit a transaction from the agent's wallet. Circle signs with the managed key
// server-side; the SDK generates the per-request entitySecretCiphertext + idempotencyKey.
// Async on Circle's side — caller polls getTransaction if it needs terminal status.
export async function signTransaction(
  walletId: string,
  tx: AgentTransaction
): Promise<{ transactionId: string }> {
  return withRetry(async () => {
    const client = await getClient();
    const res = await client.createTransaction({
      walletId,
      blockchain: ARC_BLOCKCHAIN,
      operation: { type: 'TRANSFER', destination: tx.destination, amount: tx.amount, tokenId: tx.tokenId },
      // SDK fills entitySecretCiphertext from the init entitySecret + an idempotencyKey.
    });
    return { transactionId: res.data.id };
  });
}
