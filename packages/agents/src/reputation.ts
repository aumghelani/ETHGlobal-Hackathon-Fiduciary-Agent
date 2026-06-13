import type { AgentReputation, FreelancerTrust, ClientTrust } from './types.js';

export function calculateAgentScore(rep: AgentReputation): number {
  let score = 0;

  // Volume-weighted track record (max 3.5 points) — logarithmic, prevents farming
  const volumeScore = Math.min(3.5, Math.log10(rep.totalVolume + 1) * 0.7);
  score += volumeScore;

  // Success rate (max 1.0 point)
  const totalDeals = rep.successfulSettlements + rep.disputedSettlements;
  if (totalDeals > 0) {
    const successRate = rep.successfulSettlements / totalDeals;
    score += successRate * 1.0;
  }

  // Activity bonus — dormancy reduces trust (max 0.5 point)
  const activityBonus = Math.max(0, 0.5 - (rep.daysSinceLastDeal / 60));
  score += activityBonus;

  return Math.min(5.0, Math.max(0, score));
}

export function calculateFreelancerTrust(f: FreelancerTrust): number {
  let trust = 0;

  // Identity layer (max 0.3)
  if (f.identityVerified) trust += 0.2;
  if (f.ensSubname) trust += 0.1;

  // Track record (max 0.4) — quadratic, disputes matter a lot
  const totalInvoices = f.successfulInvoices + f.disputedInvoices;
  if (totalInvoices > 0) {
    const cleanRate = f.successfulInvoices / totalInvoices;
    trust += cleanRate * cleanRate * 0.4;
  }

  // Client diversity bonus (max 0.15)
  trust += Math.min(0.15, f.uniqueClientsCount * 0.03);

  // Account age (max 0.15) — Sybil resistance
  trust += Math.min(0.15, f.accountAgeInDays / 365 * 0.15);

  return Math.min(1.0, trust);
}

export function calculateClientTrust(c: ClientTrust): number {
  let trust = 0;

  if (c.isVerifiedBusiness) trust += 0.3;

  const totalInvoices = c.invoicesPaidOnTime + c.invoicesPaidLate + c.invoicesUnpaid;
  if (totalInvoices === 0) return trust;

  const reliability = (c.invoicesPaidOnTime + 0.5 * c.invoicesPaidLate) / totalInvoices;
  trust += reliability * 0.5;

  trust += Math.min(0.2, Math.log10(c.totalVolumePaid + 1) * 0.05);

  return Math.min(1.0, trust);
}
