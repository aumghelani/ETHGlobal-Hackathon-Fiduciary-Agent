import { getClient } from "../packages/hedera/src/client.ts";
import { mintInvoiceToken } from "../packages/hedera/src/mint.ts";

async function main() {
  const client = getClient();
  const operatorId = client.operatorAccountId!.toString();

  console.log(`Minting sample invoice token as operator ${operatorId}...`);

  // Fee collector is the operator itself for this primitive test.
  // In the real flow it's the winning agent's Hedera account.
  const tokenId = await mintInvoiceToken({
    client,
    tokenName: "Invoice-DEMO001",
    tokenSymbol: "INVDEMO",
    amount: 5000,
    feePercent: 1.5,
    feeCollectorId: operatorId,
  });

  console.log(`\n✅ Token minted: ${tokenId}`);
  console.log(
    `HashScan: https://hashscan.io/testnet/token/${tokenId}`
  );

  client.close();
}

main().catch((err) => {
  console.error("\n❌ Mint failed:", err.message);
  process.exit(1);
});
