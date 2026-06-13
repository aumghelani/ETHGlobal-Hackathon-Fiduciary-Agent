import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

// Hardhat runs with cwd at the package root (packages/contracts),
// so the repo-root .env.local is two levels up.
loadEnv({ path: resolve(process.cwd(), "../../.env.local") });

const ARC_RPC_URL = process.env.ARC_RPC_URL;
const ARC_PRIVATE_KEY = process.env.ARC_PRIVATE_KEY;

// Only required when actually deploying; compile must work without credentials.
function arcAccounts(): string[] {
  if (!ARC_PRIVATE_KEY) {
    throw new Error(
      "Missing ARC_PRIVATE_KEY in .env.local — required to deploy to Arc testnet."
    );
  }
  return [ARC_PRIVATE_KEY];
}

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  paths: {
    sources: "./src",
  },
  networks: {
    arcTestnet: {
      url: ARC_RPC_URL ?? "",
      accounts: ARC_PRIVATE_KEY ? arcAccounts() : [],
      chainId: 5042002,
    },
  },
};

export default config;
