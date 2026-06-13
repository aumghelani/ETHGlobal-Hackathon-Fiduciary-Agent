import { AccountCreateTransaction, PrivateKey, Hbar } from "@hashgraph/sdk";
import { getClient } from "../packages/hedera/src/client.ts";

async function createAccount(client: any, label: string, hbar: number) {
  const key = PrivateKey.generateED25519();
  const tx = await new AccountCreateTransaction()
    .setKeyWithoutAlias(key.publicKey)
    .setInitialBalance(new Hbar(hbar))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const id = receipt.accountId!.toString();
  console.log(`  ${label}: ${id} (${hbar} ℏ)`);
  return { id, der: key.toStringDer() };
}

async function main() {
  const client = getClient();
  console.log(`Creating 3 settlement accounts as operator ${client.operatorAccountId!.toString()}...\n`);

  const inv1 = await createAccount(client, "investor1", 5);
  const inv2 = await createAccount(client, "investor2", 5);
  const trig = await createAccount(client, "settlementTrigger", 5);

  console.log("\n================ PASTE THESE INTO packages/frontend/.env.local ================\n");
  console.log(`HEDERA_INVESTOR1_ID=${inv1.id}`);
  console.log(`HEDERA_INVESTOR1_KEY=${inv1.der}`);
  console.log(`HEDERA_INVESTOR2_ID=${inv2.id}`);
  console.log(`HEDERA_INVESTOR2_KEY=${inv2.der}`);
  console.log(`HEDERA_SETTLEMENT_TRIGGER_ID=${trig.id}`);
  console.log(`HEDERA_SETTLEMENT_TRIGGER_KEY=${trig.der}`);
  console.log("\n===============================================================================");

  client.close();
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
