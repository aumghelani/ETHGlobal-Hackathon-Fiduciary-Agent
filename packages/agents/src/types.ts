export type AgentReputation = {
  score: number;              // 0.0 - 5.0
  completedDeals: number;
  totalVolume: number;        // USD across all settled deals
  successfulSettlements: number;
  disputedSettlements: number;
  averageInvoiceSize: number;
  daysSinceLastDeal: number;
};

export type FreelancerTrust = {
  identityVerified: boolean;
  ensSubname: string | null;
  successfulInvoices: number;
  disputedInvoices: number;
  totalVolumeReceived: number;
  averagePaymentDelay: number;
  accountAgeInDays: number;
  uniqueClientsCount: number;
};

export type ClientTrust = {
  isVerifiedBusiness: boolean;
  invoicesPaidOnTime: number;
  invoicesPaidLate: number;
  invoicesUnpaid: number;
  totalVolumePaid: number;
  averagePaymentDelay: number;
};

export type Invoice = {
  id: string;
  amountUsd: number;
  daysUntilDue: number;
  freelancer: FreelancerTrust;
  client: ClientTrust;
};

export type Agent = {
  id: string;
  name: string;
  reputation: AgentReputation;
  minimumRiskScore: number;  // 0-1, agent passes on invoices below this
  hederaAccountId: string;
  arcAddress: string;
};

export type Bid = {
  agentId: string;
  agentName: string;
  discountPercent: number;
  feePercent: number;
  netToFreelancer: number;
  agentEarnings: number;
  reasoning: string;
  riskScore: number;
};
