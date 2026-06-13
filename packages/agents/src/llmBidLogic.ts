import type { Invoice, Agent, Bid } from "./types.js";
import { generateDeterministicBid } from "./bidLogic.js";
import { calculateFreelancerTrust, calculateClientTrust } from "./reputation.js";
import { getClient } from "./llmClient.js";

export async function generateBid(
  invoice: Invoice,
  agent: Agent
): Promise<Bid | null> {
  const bid = generateDeterministicBid(invoice, agent);
  if (bid === null) return null;

  const f = invoice.freelancer;
  const c = invoice.client;
  const freelancerTrust = calculateFreelancerTrust(f);
  const clientTrust = calculateClientTrust(c);

  const prompt = `You are an AI fiduciary agent named ${agent.name}, with a reputation score of ${agent.reputation.score}/5.0 and ${agent.reputation.completedDeals} completed deals.

You're evaluating an invoice:
- Amount: $${invoice.amountUsd}
- Days until client pays: ${invoice.daysUntilDue}
- Freelancer trust score: ${freelancerTrust} (verified=${f.identityVerified}, history=${f.successfulInvoices} successful invoices)
- Client trust score: ${clientTrust} (verified=${c.isVerifiedBusiness}, payment history=${c.invoicesPaidOnTime} on-time / ${c.invoicesPaidLate} late)

You've calculated your bid:
- Discount offered to freelancer: ${bid.discountPercent}% (they receive $${bid.netToFreelancer})
- Your management fee: ${bid.feePercent}% (you earn $${bid.agentEarnings})

Write 2-3 sentences explaining your reasoning to the freelancer in first person ('I'). Mention what made you confident or cautious. Be conversational but professional. Do NOT mention the trust scores by number — translate them into observations ('verified client with a strong payment record' etc.). Maximum 280 characters.`;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (text !== "") {
      bid.reasoning = text;
    }
    return bid;
  } catch (err) {
    console.error("LLM reasoning failed, using deterministic reasoning:", err);
    return bid;
  }
}
