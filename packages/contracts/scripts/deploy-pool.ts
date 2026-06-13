import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import { ethers } from "hardhat";

loadEnv({ path: resolve(process.cwd(), "../../.env.local") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable ${name} in .env.local.`);
  }
  return value.trim();
}

async function main() {
  requireEnv("ARC_RPC_URL");
  requireEnv("ARC_PRIVATE_KEY");
  const usdc = requireEnv("ARC_USDC_ADDRESS");
  const freelancer = requireEnv("FREELANCER_ADDRESS");
  const agent = requireEnv("AGENT_ADDRESS");

  const targetAmount = 4900_000000n;
  const clientPaymentAmount = 5000_000000n;
  const agentFeeBasisPoints = 150n;

  const InvoicePool = await ethers.getContractFactory("InvoicePool");
  const pool = await InvoicePool.deploy(
    freelancer,
    agent,
    targetAmount,
    clientPaymentAmount,
    agentFeeBasisPoints,
    usdc
  );
  await pool.waitForDeployment();

  const address = await pool.getAddress();
  console.log(`InvoicePool deployed: ${address}`);
  console.log(`Explorer: https://testnet.arcscan.app/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
