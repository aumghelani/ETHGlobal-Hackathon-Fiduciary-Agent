import { TopicCreateTransaction } from "@hashgraph/sdk";
import { getClient } from "../packages/hedera/src/client.ts";

// One-off: create the single shared HCS topic the whole app writes invoice
// hashes to (double-spend prevention, THREAT_MODEL Layer 3). Run ONCE, then
// paste the printed HEDERA_HCS_TOPIC_ID into .env.local (root + frontend).
async function main() {
  const client = getClient();
  const operatorId = client.operatorAccountId!.toString();

  console.log(`Creating HCS topic as operator ${operatorId}...`);

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("fiduciary-invoice-hashes-v1")
    .execute(client);
  const receipt = await tx.getReceipt(client);

  const topicId = receipt.topicId!.toString();

  console.log(`\n✅ HCS topic created: ${topicId}`);
  console.log(`HashScan: https://hashscan.io/testnet/topic/${topicId}`);
  console.log("\n================ PASTE INTO .env.local (root AND packages/frontend) ================\n");
  console.log(`HEDERA_HCS_TOPIC_ID=${topicId}`);
  console.log("\n=====================================================================================");

  client.close();
}

main().catch((err) => {
  console.error("\n❌ Topic creation failed:", err.message);
  process.exit(1);
});
