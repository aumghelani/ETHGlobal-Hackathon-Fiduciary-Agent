import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { ethers } from "ethers";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

const POOL_ADDRESS = "0x41862486886E0A2f448C1888671515E572D5E562";
const DEPOSIT_AMOUNT = 5_000000n; // 5 USDC (6 decimals) — within faucet's 20 USDC minus gas

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const POOL_ABI = [
  "function deposit(uint256 amount)",
  "function totalRaised() view returns (uint256)",
  "function deposits(address) view returns (uint256)",
];

function explorerTx(hash: string): string {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

async function main() {
  // Arc testnet RPC has variable latency; raise ethers' per-request timeout
  // (default is too aggressive) so slow responses don't spuriously time out.
  const fetchReq = new ethers.FetchRequest(process.env.ARC_RPC_URL!);
  fetchReq.timeout = 60_000;
  const provider = new ethers.JsonRpcProvider(
    fetchReq,
    { chainId: 5042002, name: "arc-testnet" },
    { staticNetwork: true }
  );
  const wallet = new ethers.Wallet(process.env.ARC_PRIVATE_KEY!, provider);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Pool: ${POOL_ADDRESS}`);

  const usdc = new ethers.Contract(process.env.ARC_USDC_ADDRESS!, ERC20_ABI, wallet);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, wallet);

  const existing: bigint = await usdc.allowance(wallet.address, POOL_ADDRESS);
  if (existing >= DEPOSIT_AMOUNT) {
    console.log(`\nAllowance already sufficient (${Number(existing) / 1_000_000} USDC) — skipping approve.`);
  } else {
    console.log("\nApproving pool to spend 5 USDC...");
    const approveTx = await usdc.approve(POOL_ADDRESS, DEPOSIT_AMOUNT);
    await approveTx.wait();
    console.log(`Approve tx: ${explorerTx(approveTx.hash)}`);
  }

  console.log("Depositing 5 USDC...");
  const depositTx = await pool.deposit(DEPOSIT_AMOUNT);
  await depositTx.wait();
  console.log(`Deposit tx: ${explorerTx(depositTx.hash)}`);

  const totalRaised: bigint = await pool.totalRaised();
  const myDeposit: bigint = await pool.deposits(wallet.address);
  console.log(`\ntotalRaised: ${totalRaised} base units (${Number(totalRaised) / 1_000_000} USDC)`);
  console.log(`deposits[deployer]: ${myDeposit} base units (${Number(myDeposit) / 1_000_000} USDC)`);
  console.log("\n✅ Arc deployment verified with live deposit");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
