import type { Agent, Invoice } from "../packages/agents/src/types.ts";
import { generateBid } from "../packages/agents/src/llmBidLogic.ts";

const veteran: Agent = {
  id: "veteran",
  name: "Veteran-Agent",
  reputation: {
    score: 4.8,
    completedDeals: 500,
    totalVolume: 1_000_000,
    successfulSettlements: 495,
    disputedSettlements: 5,
    averageInvoiceSize: 0,
    daysSinceLastDeal: 2,
  },
  minimumRiskScore: 0.5,
  hederaAccountId: "",
  arcAddress: "",
};

const newbie: Agent = {
  id: "newbie",
  name: "Newbie-Agent",
  reputation: {
    score: 0.5,
    completedDeals: 0,
    totalVolume: 0,
    successfulSettlements: 0,
    disputedSettlements: 0,
    averageInvoiceSize: 0,
    daysSinceLastDeal: 0,
  },
  minimumRiskScore: 0.1,
  hederaAccountId: "",
  arcAddress: "",
};

const invoice: Invoice = {
  id: "demo-001",
  amountUsd: 5000,
  daysUntilDue: 60,
  freelancer: {
    identityVerified: true,
    ensSubname: "maria.fid.eth",
    successfulInvoices: 5,
    disputedInvoices: 0,
    totalVolumeReceived: 20000,
    averagePaymentDelay: 2,
    accountAgeInDays: 180,
    uniqueClientsCount: 2,
  },
  client: {
    isVerifiedBusiness: true,
    invoicesPaidOnTime: 8,
    invoicesPaidLate: 1,
    invoicesUnpaid: 0,
    totalVolumePaid: 50000,
    averagePaymentDelay: 3,
  },
};

async function run(agent: Agent) {
  const start = Date.now();
  const bid = await generateBid(invoice, agent);
  const ms = Date.now() - start;

  console.log(`\n${agent.name} (rep ${agent.reputation.score}/5) — ${ms}ms`);
  if (bid === null) {
    console.log("  PASSED (too risky)");
    return;
  }
  console.log(`  discount   ${bid.discountPercent}%`);
  console.log(`  fee        ${bid.feePercent}%`);
  console.log(`  net        $${bid.netToFreelancer}`);
  console.log(`  earnings   $${bid.agentEarnings}`);
  console.log(`  riskScore  ${bid.riskScore}`);
  console.log(`  reasoning  ${bid.reasoning}`);
}

async function main() {
  await run(veteran);
  await run(newbie);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
