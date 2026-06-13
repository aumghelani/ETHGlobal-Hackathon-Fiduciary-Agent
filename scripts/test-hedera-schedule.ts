import {
  AccountCreateTransaction,
  TokenAssociateTransaction,
  ScheduleInfoQuery,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";
import { getClient } from "../packages/hedera/src/client.ts";
import { mintInvoiceToken } from "../packages/hedera/src/mint.ts";
import {
  scheduleDistribution,
  executeSchedule,
} from "../packages/hedera/src/schedule.ts";

async function createRecipient(client: any): Promise<{ accountId: string; key: PrivateKey }> {
  const key = PrivateKey.generateED25519();
  const tx = await new AccountCreateTransaction()
    .setKeyWithoutAlias(key.publicKey)
    .setInitialBalance(new Hbar(5))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return { accountId: receipt.accountId!.toString(), key };
}

async function associateToken(client: any, accountId: string, key: PrivateKey, tokenId: string) {
  const tx = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(key);
  await (await tx.execute(client)).getReceipt(client);
}

async function main() {
  const client = getClient();
  const operatorId = client.operatorAccountId!.toString();

  console.log("Minting fresh invoice token...");
  const tokenId = await mintInvoiceToken({
    client,
    tokenName: "Invoice-schedule-test",
    tokenSymbol: "INVSCH",
    amount: 5000,
    feePercent: 1.5,
    feeCollectorId: operatorId,
  });
  console.log(`Token: ${tokenId}`);

  console.log("Creating two recipient accounts + one settlement-trigger account...");
  const r1 = await createRecipient(client);
  const r2 = await createRecipient(client);
  const trigger = await createRecipient(client);
  console.log(`Recipient 1: ${r1.accountId}`);
  console.log(`Recipient 2: ${r2.accountId}`);
  console.log(`Settlement trigger: ${trigger.accountId}`);

  console.log("Associating token with recipients (not the trigger)...");
  await associateToken(client, r1.accountId, r1.key, tokenId);
  await associateToken(client, r2.accountId, r2.key, tokenId);

  const recipients = [
    { accountId: r1.accountId, amount: 60000 },
    { accountId: r2.accountId, amount: 40000 },
  ];

  console.log("Creating scheduled distribution...");
  const sched = await scheduleDistribution({
    tokenId,
    recipients,
    treasuryAccountId: operatorId,
    settlementTrigger: {
      accountId: trigger.accountId,
      publicKey: trigger.key.publicKey,
    },
  });
  console.log(`Schedule: ${sched.scheduleId}`);
  console.log(`Schedule HashScan: ${sched.hashScanUrl}`);

  const infoBefore = await new ScheduleInfoQuery()
    .setScheduleId(sched.scheduleId)
    .execute(client);
  if (infoBefore.executed !== null) {
    throw new Error("Schedule already executed at creation — trigger signature was not required.");
  }
  console.log("Schedule created, PENDING signature from settlement trigger");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("Executing schedule via settlement-trigger signature...");
  const exec = await executeSchedule(sched.scheduleId, trigger.key);
  console.log(`Execution txId: ${exec.txId}`);
  console.log(`Execution HashScan: ${exec.hashScanUrl}`);

  const infoAfter = await new ScheduleInfoQuery()
    .setScheduleId(sched.scheduleId)
    .execute(client);
  if (infoAfter.executed === null) {
    throw new Error("Schedule still pending after executeSchedule — not executed.");
  }
  console.log("Schedule executed via settlement-trigger signature, distribution complete");
  console.log("\n✅ Scheduled distribution executed successfully");

  client.close();
}

main().catch((err) => {
  console.error("\n❌ Failed:", err);
  process.exit(1);
});
