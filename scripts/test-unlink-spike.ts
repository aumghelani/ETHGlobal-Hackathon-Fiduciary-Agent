import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { ethers } from 'ethers';

loadEnv({ path: 'D:/ETHGlobal Hackathon/.env.local' });

const ENV = 'arc-testnet';
const CHAIN_ID = 5042002;
const RPC = process.env.ARC_RPC_URL!;
const PK = process.env.ARC_PRIVATE_KEY!;
const USDC = process.env.ARC_USDC_ADDRESS!;
const API_KEY = process.env.UNLINK_API_KEY!;
const APP_ID = process.env.UNLINK_APP_ID ?? 'fiduciary';
const AMOUNT = '100000'; // 0.1 USDC (6 decimals)

function provider() {
  const fr = new ethers.FetchRequest(RPC);
  fr.timeout = 60_000;
  return new ethers.JsonRpcProvider(fr, { chainId: CHAIN_ID, name: 'arc-testnet' }, { staticNetwork: true });
}

async function main() {
  console.log('=== Unlink server-only spike (Arc testnet) ===');
  const wallet = new ethers.Wallet(PK, provider());
  console.log('Signer address:', wallet.address);

  // Inspect what the client module actually exports server-side.
  const client = await import('@unlink-xyz/sdk/client');
  console.log('client exports:', Object.keys(client).sort().join(', '));
  const account: any = (client as any).account;
  const evm: any = (client as any).evm;
  console.log('account factories:', account ? Object.keys(account).join(', ') : '(none)');
  console.log('evm factories:', evm ? Object.keys(evm).join(', ') : '(none)');

  // ATTEMPT: derive the Unlink account from a manual Ethereum signature — the
  // documented browser step (buildDeriveSeedMessage → sign → fromEthereumSignature),
  // but we sign with an ethers Wallet instead of MetaMask. Fully server-side.
  console.log('\n--- ATTEMPT: account from manual Ethereum signature (server-only, no MetaMask) ---');
  let unlinkAccount: any = null;
  try {
    const crypto = await import('@unlink-xyz/sdk/crypto');
    const msg = (crypto as any).buildDeriveSeedMessage({ appId: APP_ID, chainId: CHAIN_ID });
    console.log('seed message:', String(msg).slice(0, 80) + '...');
    const signature = await wallet.signMessage(msg);
    unlinkAccount = account.fromEthereumSignature({ signature, appId: APP_ID, chainId: CHAIN_ID });
    console.log('account.fromEthereumSignature OK.');
  } catch (e: any) {
    console.log('ATTEMPT FAILED:', e?.message);
  }

  if (!unlinkAccount) {
    console.log('\n=== RESULT: no server-side account path worked. MetaMask/window.ethereum likely required. ===');
    process.exit(2);
  }

  // Build the EVM provider from the ethers signer (server-side, no MetaMask).
  let evmProvider: any = null;
  try {
    evmProvider = evm.fromEthers({ signer: wallet });
    console.log('evm.fromEthers OK.');
  } catch (e: any) {
    console.log('evm.fromEthers FAILED:', e?.message);
  }

  // FIX 2: register the account + issue an authorization token via the admin
  // client (server-only, uses the API key). The earlier failures showed the
  // client tried to POST /api/unlink/register with no base URL — it needs an
  // admin-minted authorizationToken instead.
  console.log('\n--- FIX 2: admin register + issue authorization token ---');
  let authToken: any = null;
  try {
    const adminMod = await import('@unlink-xyz/sdk/admin');
    const admin = (adminMod as any).createUnlinkAdmin({ environment: ENV, apiKey: API_KEY });
    console.log('createUnlinkAdmin OK. admin keys:', Object.keys(admin).join(', '));

    // toRegistrationPayload is a standalone namespace fn taking the account as the provider.
    const payload = await account.toRegistrationPayload(unlinkAccount);
    const reg = await admin.users.register(payload);
    console.log('admin.users.register OK:', JSON.stringify(reg));

    authToken = await admin.authorizationTokens.issue({
      unlinkAddress: reg.address,
      subjectType: 'unlink_address',
    });
    console.log('authorizationTokens.issue OK. token expiresAt:', authToken?.expiresAt);
  } catch (e: any) {
    console.log('FIX 2 admin step FAILED:', e?.message, '| code:', e?.code);
  }

  console.log('\n--- Creating Unlink client (with authorizationToken) ---');
  let unlinkClient: any = null;
  try {
    unlinkClient = client.createUnlinkClient({
      environment: ENV,
      account: unlinkAccount,
      evm: evmProvider ?? undefined,
      authorizationToken: authToken
        ? { provider: async () => ({ token: authToken.token, expiresAt: authToken.expiresAt }) }
        : undefined,
    } as any);
    console.log('createUnlinkClient OK. methods:', Object.keys(unlinkClient).filter(k => typeof unlinkClient[k] === 'function').join(', '));
  } catch (e: any) {
    console.log('createUnlinkClient FAILED:', e?.message);
    process.exit(3);
  }

  // FIX 1: the privacy pool may only support a project-configured test token,
  // not raw USDC. Discover the env's token + use the faucet.
  console.log('\n--- env info (looking for the project test token) ---');
  try {
    const info = await unlinkClient.loadEnvironmentInfo();
    console.log('environmentInfo:', JSON.stringify(info, null, 2).slice(0, 1200));
  } catch (e: any) {
    console.log('loadEnvironmentInfo failed:', e?.message);
  }

  console.log('\n--- faucet namespace ---');
  const faucet = unlinkClient.faucet;
  console.log('faucet methods:', faucet ? Object.keys(faucet).filter(k => typeof faucet[k] === 'function').join(', ') : '(none)');

  // Candidate tokens to try, in order: env-reported token (if any), then USDC.
  const TEST_TOKEN = process.env.UNLINK_TEST_TOKEN; // optional override from dashboard
  const candidates = [TEST_TOKEN, USDC].filter(Boolean) as string[];

  for (const token of candidates) {
    console.log(`\n=== Trying token ${token} ===`);

    console.log('-- requestTestTokens (mint public test ERC20) --');
    try {
      const r = await faucet.requestTestTokens({ token, amount: '1000000' });
      console.log('requestTestTokens OK:', JSON.stringify(r).slice(0, 300));
    } catch (e: any) {
      console.log('requestTestTokens FAILED:', e?.message, '| code:', e?.code);
    }

    console.log('-- requestPrivateTokens (shielded faucet into Unlink acct) --');
    try {
      const r = await faucet.requestPrivateTokens({ token, amount: '1000000' });
      console.log('requestPrivateTokens OK:', JSON.stringify(r).slice(0, 300));
      const hash = (r as any)?.txHash ?? (r as any)?.transactionHash ?? (r as any)?.hash;
      if (hash) {
        console.log('\n✅ PRIVATE FAUCET TRANSFER tx:', hash);
        console.log('Explorer: https://testnet.arcscan.app/tx/' + hash);
      }
    } catch (e: any) {
      console.log('requestPrivateTokens FAILED:', e?.message, '| code:', e?.code);
    }

    console.log('-- depositWithApproval --');
    try {
      const tx = await unlinkClient.depositWithApproval({ token, amount: AMOUNT });
      console.log('deposit submitted; waiting...');
      const result = await tx.wait();
      const hash = tx.hash ?? result?.hash ?? (result as any)?.txHash ?? JSON.stringify(result).slice(0, 200);
      console.log('\n✅ DEPOSIT SUCCEEDED with token', token, '— tx:', hash);
      console.log('Explorer: https://testnet.arcscan.app/tx/' + hash);
      return; // STOP on first success
    } catch (e: any) {
      console.log('depositWithApproval FAILED:', e?.message, '| name:', e?.name, '| code:', e?.code);
    }
  }

  console.log('\n=== FIX 1 produced no deposit tx hash. Proceed to FIX 2 (authorizationToken). ===');
  process.exit(4);
}

main().catch((e) => {
  console.error('SPIKE CRASHED:', e?.message ?? e);
  process.exit(1);
});
