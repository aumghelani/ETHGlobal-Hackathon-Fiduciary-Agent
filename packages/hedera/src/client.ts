import { Client, AccountId, PrivateKey } from "@hashgraph/sdk";
import { config as loadEnv } from "dotenv";

// Load .env.local from the repo root. Hedera operations run server-side only,
// so credentials live in the process environment, never the browser.
loadEnv({ path: new URL("../../../.env.local", import.meta.url).pathname });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Add it to .env.local at the repo root (see .env.example).`
    );
  }
  return value.trim();
}

export function getClient(): Client {
  const operatorId = requireEnv("HEDERA_OPERATOR_ID");
  const operatorKey = requireEnv("HEDERA_OPERATOR_KEY");
  const network = (process.env.HEDERA_NETWORK ?? "testnet").trim().toLowerCase();

  let accountId: AccountId;
  try {
    accountId = AccountId.fromString(operatorId);
  } catch {
    throw new Error(
      `HEDERA_OPERATOR_ID is malformed: "${operatorId}". ` +
        `Expected a Hedera account ID like 0.0.123456.`
    );
  }

  let privateKey: PrivateKey;
  try {
    privateKey = PrivateKey.fromStringED25519(operatorKey);
  } catch {
    throw new Error(
      `HEDERA_OPERATOR_KEY is malformed or not a valid ED25519 private key. ` +
        `Copy the DER-encoded private key from portal.hedera.com.`
    );
  }

  let client: Client;
  switch (network) {
    case "mainnet":
      client = Client.forMainnet();
      break;
    case "testnet":
      client = Client.forTestnet();
      break;
    default:
      throw new Error(
        `HEDERA_NETWORK is "${network}" but must be "testnet" or "mainnet".`
      );
  }

  client.setOperator(accountId, privateKey);
  return client;
}
