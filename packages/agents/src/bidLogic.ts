import type { Invoice, Agent, Bid } from './types.js';
import { calculateFreelancerTrust, calculateClientTrust } from './reputation.js';

export function generateDeterministicBid(invoice: Invoice, agent: Agent): Bid | null {
  const freelancerTrust = calculateFreelancerTrust(invoice.freelancer);
  const clientTrust = calculateClientTrust(invoice.client);

  // Composite risk score (0 = highest risk, 1 = lowest risk)
  const riskScore = (freelancerTrust * 0.4) + (clientTrust * 0.6);

  // PASS if too risky for this agent
  if (riskScore < agent.minimumRiskScore) return null;

  // Discount: inverse of risk, with reputation compression proportional
  // to the risk-driven discount so veterans differentiate even at low risk
  const minDiscount = 1.5;
  const maxDiscount = 15;
  const riskComponent = (1 - riskScore) * (maxDiscount - minDiscount);
  const discountCompression = (agent.reputation.score / 5.0) * (riskComponent * 0.6);
  const finalDiscount = Math.max(minDiscount, riskComponent - discountCompression + minDiscount);

  // Fee — reputation COMPRESSES it (the inversion)
  const baseFee = 2.5;
  const reputationCompression = (agent.reputation.score / 5.0) * 1.8;
  const finalFee = Math.max(0.5, baseFee - reputationCompression);

  const netToFreelancer = invoice.amountUsd * (1 - finalDiscount / 100);
  const agentEarnings = invoice.amountUsd * (finalFee / 100);

  return {
    agentId: agent.id,
    agentName: agent.name,
    discountPercent: parseFloat(finalDiscount.toFixed(2)),
    feePercent: parseFloat(finalFee.toFixed(2)),
    netToFreelancer: parseFloat(netToFreelancer.toFixed(2)),
    agentEarnings: parseFloat(agentEarnings.toFixed(2)),
    reasoning: `Risk score ${riskScore.toFixed(2)} (freelancer ${freelancerTrust.toFixed(2)}, client ${clientTrust.toFixed(2)}). My reputation ${agent.reputation.score.toFixed(2)}/5.`,
    riskScore: parseFloat(riskScore.toFixed(2)),
  };
}
