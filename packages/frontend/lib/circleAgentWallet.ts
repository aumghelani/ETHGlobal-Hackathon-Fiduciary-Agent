// Circle Developer-Controlled (Agent) Wallets — server-side. An autonomous "fiduciary
// agent" holds USDC in a Circle-managed wallet on Arc and signs transfers via Circle's
// API (Circle signs with the managed key; we never hold a private key). Arc testnet is
// supported (ARC-TESTNET). See docs/CIRCLE_AGENT_RECON.md + ADR-021.
//
// Requires CIRCLE_AGENT_API_KEY + a registered CIRCLE_AGENT_ENTITY_SECRET. When those are
// absent the helpers throw a clear error; callers gate on isCircleConfigured() so the
// existing spine never breaks (graceful degradation, like the World ID demo bypass).
import { withRetry } from './retry';
import {
  initiateDeveloperControlledWalletsClient,
  type CircleDeveloperControlledWalletsClient,
} from '@circle-fin/developer-controlled-wallets';

const ARC_BLOCKCHAIN = 'ARC-TESTNET'; // confirmed enum value (Blockchain.ArcTestnet)

export interface SpendingPolicy {
  // Illustrative cap recorded alongside the wallet. Circle's enforced spending limits
  // are configured via the Console/Agent-policy layer; we record intent here and note it.
  maxAmount: string;
  period?: 'transaction' | 'daily' | 'weekly' | 'monthly';
  token?: string;
}

export interface AgentTransfer {
  destinationAddress: string;
  amount: string; // human-readable units (e.g. "0.01")
  tokenId: string; // Circle token id for USDC on Arc
}

// True when Circle creds are present. Callers use this to decide whether to route
// through Circle or fall back to the existing operator-key path (ADR-013).
export function isCircleConfigured(): boolean {
  return !!(process.env.CIRCLE_AGENT_API_KEY && process.env.CIRCLE_AGENT_ENTITY_SECRET);
}

let _client: CircleDeveloperControlledWalletsClient | null = null;
function getClient(): CircleDeveloperControlledWalletsClient {
  if (!isCircleConfigured()) {
    throw new Error(
      'Missing CIRCLE_AGENT_API_KEY / CIRCLE_AGENT_ENTITY_SECRET. Sign up at console.circle.com ' +
        '+ register an entity secret (see docs/CIRCLE_AGENT_RECON.md).'
    );
  }
  if (!_client) {
    _client = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_AGENT_API_KEY!,
      entitySecret: process.env.CIRCLE_AGENT_ENTITY_SECRET!,
    });
  }
  return _client;
}

// Provision a fresh Circle wallet for an agent on Arc testnet: create a wallet set,
// then one EOA wallet inside it. Returns the wallet id + on-chain address.
export async function provisionAgentWallet(
  agentName: string
): Promise<{ walletId: string; address: string }> {
  return withRetry(async () => {
    const client = getClient();
    const setRes = await client.createWalletSet({ name: `fiduciary-${agentName}` });
    const walletSetId = setRes.data!.walletSet.id;
    const walletsRes = await client.createWallets({
      blockchains: [ARC_BLOCKCHAIN as any],
      count: 1,
      walletSetId,
    });
    const w = walletsRes.data!.wallets[0];
    return { walletId: w.id, address: w.address };
  });
}

// Record a spending policy for the wallet. Circle's enforced caps live in the Console /
// Agent-policy layer (recon flags this surface as not-fully-API-exposed); we validate the
// client + record the intent so the integration is honest about what's enforced where.
export async function setSpendingPolicy(
  walletId: string,
  policy: SpendingPolicy
): Promise<{ walletId: string; policy: SpendingPolicy; enforced: boolean }> {
  getClient(); // validate creds/SDK so a misconfig surfaces here, not silently
  // TODO(verify): wire to Circle's transaction-policy endpoint once confirmed on the API.
  return { walletId, policy, enforced: false };
}

// Initiate a USDC transfer from the agent's Circle wallet. Circle signs server-side with
// the managed key; the SDK supplies entitySecretCiphertext + idempotencyKey per request.
// Async on Circle's side — returns the transaction id; poll getTransaction for terminal state.
export async function signTransaction(
  walletId: string,
  tx: AgentTransfer
): Promise<{ transactionId: string }> {
  return withRetry(async () => {
    const client = getClient();
    const res = await client.createTransaction({
      walletId,
      tokenId: tx.tokenId,
      destinationAddress: tx.destinationAddress,
      amount: [tx.amount],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    });
    const id = (res.data as any)?.id ?? (res.data as any)?.transaction?.id;
    return { transactionId: id };
  });
}
