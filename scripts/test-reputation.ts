import type { Agent, Invoice, Bid } from "../packages/agents/src/types.ts";
import { generateDeterministicBid } from "../packages/agents/src/bidLogic.ts";

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

const vetBid = generateDeterministicBid(invoice, veteran);
const newBid = generateDeterministicBid(invoice, newbie);

function fmt(bid: Bid | null): string {
  if (bid === null) return "PASSED (too risky)";
  return [
    `discount   ${bid.discountPercent}%`,
    `fee        ${bid.feePercent}%`,
    `net        $${bid.netToFreelancer}`,
    `earnings   $${bid.agentEarnings}`,
    `riskScore  ${bid.riskScore}`,
  ].join("\n  ");
}

console.log(`Invoice: $${invoice.amountUsd}, due in ${invoice.daysUntilDue} days\n`);
console.log(`${veteran.name} (rep ${veteran.reputation.score}/5)`);
console.log(`  ${fmt(vetBid)}\n`);
console.log(`${newbie.name} (rep ${newbie.reputation.score}/5)`);
console.log(`  ${fmt(newBid)}\n`);

if (vetBid && newBid) {
  console.log("--- THE INVERSION ---");
  console.log(
    `Veteran offers a SMALLER discount (${vetBid.discountPercent}% vs ${newBid.discountPercent}%) ` +
      `=> freelancer keeps more ($${vetBid.netToFreelancer} vs $${newBid.netToFreelancer})`
  );
  console.log(
    `Veteran charges a LOWER fee (${vetBid.feePercent}% vs ${newBid.feePercent}%) ` +
      `=> earns less per deal ($${vetBid.agentEarnings} vs $${newBid.agentEarnings})`
  );
}

const riskyInvoice: Invoice = {
  id: "demo-002",
  amountUsd: 3000,
  daysUntilDue: 90,
  freelancer: {
    identityVerified: false,
    ensSubname: null,
    successfulInvoices: 0,
    disputedInvoices: 1,
    totalVolumeReceived: 0,
    averagePaymentDelay: 15,
    accountAgeInDays: 14,
    uniqueClientsCount: 1,
  },
  client: {
    isVerifiedBusiness: false,
    invoicesPaidOnTime: 0,
    invoicesPaidLate: 2,
    invoicesUnpaid: 1,
    totalVolumePaid: 500,
    averagePaymentDelay: 20,
  },
};

const vetRiskyBid = generateDeterministicBid(riskyInvoice, veteran);
const newRiskyBid = generateDeterministicBid(riskyInvoice, newbie);

console.log(`\nInvoice 2 (high risk): $${riskyInvoice.amountUsd}, due in ${riskyInvoice.daysUntilDue} days\n`);
console.log(`${veteran.name} (rep ${veteran.reputation.score}/5)`);
if (vetRiskyBid === null) {
  console.log(`  Veteran: PASSED on this invoice (too risky)\n`);
} else {
  console.log(`  ${fmt(vetRiskyBid)}\n`);
}
console.log(`${newbie.name} (rep ${newbie.reputation.score}/5)`);
console.log(`  ${fmt(newRiskyBid)}\n`);

let failed = false;

if (
  vetBid === null ||
  newBid === null ||
  !(vetBid.discountPercent < newBid.discountPercent) ||
  !(vetBid.feePercent < newBid.feePercent)
) {
  console.log("INVERSION FAILED");
  failed = true;
}

if (vetRiskyBid !== null || newRiskyBid === null) {
  console.log("PASS PATH FAILED");
  failed = true;
}

if (failed) process.exit(1);
