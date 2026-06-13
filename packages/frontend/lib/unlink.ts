import { ethers } from 'ethers';
import { account, evm, createUnlinkClient } from '@unlink-xyz/sdk/client';
import { createUnlinkAdmin } from '@unlink-xyz/sdk/admin';
import { buildDeriveSeedMessage } from '@unlink-xyz/sdk/crypto';

const ENV = 'arc-testnet';
const CHAIN_ID = 5042002;

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

// Server-only private deposit into Unlink's privacy pool on Arc (no browser/MetaMask).
// Pattern verified in the spike — see UNLINK_RECON.md "SPIKE RESULTS — FINAL".
export async function privateDepositOnUnlink({
  amountUsdc,
}: {
  amountUsdc: bigint;
}): Promise<{ txHash: string; poolAddress: string }> {
  const appId = process.env.UNLINK_APP_ID!;
  const apiKey = process.env.UNLINK_API_KEY!;
  const wallet = getWallet();

  // 1. Derive the Unlink account from an ethers-signed message.
  const msg = buildDeriveSeedMessage({ appId, chainId: CHAIN_ID });
  const signature = await wallet.signMessage(msg);
  const unlinkAccount = account.fromEthereumSignature({ signature, appId, chainId: CHAIN_ID });

  // 2-3. Admin: register the account + issue an authorization token.
  const admin = createUnlinkAdmin({ environment: ENV, apiKey });
  const payload = await account.toRegistrationPayload(unlinkAccount);
  const reg = await admin.users.register(payload);
  const authToken = await admin.authorizationTokens.issue({
    unlinkAddress: reg.address,
    subjectType: 'unlink_address',
  });

  // 4. User client with the authorization token + ethers-backed EVM provider.
  const client = createUnlinkClient({
    environment: ENV,
    account: unlinkAccount,
    evm: evm.fromEthers({ signer: wallet }),
    authorizationToken: {
      provider: async () => ({ token: authToken.token, expiresAt: authToken.expiresAt }),
    },
  });

  // 5. Deposit raw Arc USDC into the privacy pool.
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
}
