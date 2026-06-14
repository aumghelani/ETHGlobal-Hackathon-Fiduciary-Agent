import { ethers } from 'ethers';
import { account, evm, createUnlinkClient } from '@unlink-xyz/sdk/client';
import { createUnlinkAdmin } from '@unlink-xyz/sdk/admin';
import { buildDeriveSeedMessage } from '@unlink-xyz/sdk/crypto';

const ENV = 'arc-testnet';
const CHAIN_ID = 5042002;

// Retry transient connect failures (Arc RPC / Unlink engine occasionally drop a
// request even on a stable network). Register is idempotent, so re-running the
// network flow is safe.
async function withRetry<T>(fn: () => Promise<T>, tries = 3, delayMs = 2000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function getWallet(): ethers.Wallet {
  const fr = new ethers.FetchRequest(process.env.ARC_RPC_URL!);
  fr.timeout = 60_000;
  const provider = new ethers.JsonRpcProvider(
    fr,
    { chainId: CHAIN_ID, name: 'arc-testnet' },
    { staticNetwork: true }
  );
  return new ethers.Wallet(process.env.ARC_PRIVATE_KEY!, provider);
}

// Build a server-side Unlink client for the deterministic operator-derived account
// (no browser/MetaMask). The SAME account every call — derived from ARC_PRIVATE_KEY +
// UNLINK_APP_ID — so deposits and the matching payout act on one shared privacy position.
// Pattern verified in the spike — see UNLINK_RECON.md "SPIKE RESULTS — FINAL".
async function getUnlinkClient() {
  const appId = process.env.UNLINK_APP_ID!;
  const apiKey = process.env.UNLINK_API_KEY!;
  const wallet = getWallet();

  const msg = buildDeriveSeedMessage({ appId, chainId: CHAIN_ID });
  const signature = await wallet.signMessage(msg);
  const unlinkAccount = account.fromEthereumSignature({ signature, appId, chainId: CHAIN_ID });

  const admin = createUnlinkAdmin({ environment: ENV, apiKey });
  const payload = await account.toRegistrationPayload(unlinkAccount);
  const reg = await admin.users.register(payload);
  const authToken = await admin.authorizationTokens.issue({
    unlinkAddress: reg.address,
    subjectType: 'unlink_address',
  });

  const client = createUnlinkClient({
    environment: ENV,
    account: unlinkAccount,
    evm: evm.fromEthers({ signer: wallet }),
    authorizationToken: {
      provider: async () => ({ token: authToken.token, expiresAt: authToken.expiresAt }),
    },
  });

  return client;
}

// Server-only private deposit into Unlink's privacy pool on Arc.
export async function privateDepositOnUnlink({
  amountUsdc,
}: {
  amountUsdc: bigint;
}): Promise<{ txHash: string; poolAddress: string }> {
  return withRetry(async () => {
    const client = await getUnlinkClient();
    const info = await client.getEnvironmentInfo();
    const tx = await client.depositWithApproval({
      token: process.env.ARC_USDC_ADDRESS!,
      amount: amountUsdc.toString(),
    });
    const result = await tx.wait();
    return {
      txHash: result.txHash ?? tx.txHash ?? '',
      poolAddress: (info as any).pool_address,
    };
  });
}

// Server-only PRIVATE PAYOUT: withdraw USDC out of the shared Unlink privacy position
// to a recipient EVM address (Track E — private investors get paid back). Because
// privateDeposits store no per-investor recipient (privacy) and all private money sits
// in ONE shared position, the payout withdraws the aggregate to a single configurable
// custodian address (PRIVATE_PAYOUT_ADDRESS, default the operator) — NOT per-investor.
// See ADR-024. Retried; the caller treats failure as non-fatal.
export async function privatePayoutOnUnlink({
  recipientEvmAddress,
  amountUsdc,
}: {
  recipientEvmAddress: string;
  amountUsdc: bigint;
}): Promise<{ txHash: string }> {
  return withRetry(async () => {
    const client = await getUnlinkClient();
    const tx = await client.withdraw({
      recipientEvmAddress,
      token: process.env.ARC_USDC_ADDRESS!,
      amount: amountUsdc.toString(),
    });
    const result = await tx.wait();
    return { txHash: result.txHash ?? tx.txHash ?? '' };
  });
}
