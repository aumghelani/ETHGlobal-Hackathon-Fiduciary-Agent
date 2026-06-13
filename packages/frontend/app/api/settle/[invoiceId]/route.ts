import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState, settlePool } from '@/lib/arc';
import { scheduleDistribution, executeSchedule, PrivateKey } from '@fiduciary/hedera';
import { calculateAgentScore } from '@fiduciary/agents';
import { withRetry } from '@/lib/retry';

// Small spacing between sequential on-chain operations — eases RPC pressure and
// gives the network a beat between txns (per demo tuning).
const gap = () => new Promise((r) => setTimeout(r, 2000));

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = getStore();
  const invoice = store.invoices.get(params.invoiceId);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const tokenId = (invoice as any).tokenId as string | undefined;
  const poolAddress = (invoice as any).poolAddress as string | undefined;
  if (!tokenId || !poolAddress) {
    return NextResponse.json({ error: 'This invoice has not been accepted yet.' }, { status: 409 });
  }
  if ((invoice as any).status === 'settled') {
    return NextResponse.json({ error: 'This invoice is already settled.' }, { status: 409 });
  }

  // The on-chain InvoicePool.funded() flag is the only valid gate — private (Unlink)
  // dollars don't count toward it. Reject if the public pool isn't funded to target.
  let state;
  try {
    state = await getPoolState(poolAddress);
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the payment network. Please try again.' },
      { status: 502 }
    );
  }
  if (state.settled) {
    return NextResponse.json({ error: 'This invoice is already settled.' }, { status: 409 });
  }
  if (!state.funded) {
    return NextResponse.json(
      { error: 'Not fully funded yet — fund the invoice to 100% before settling.' },
      { status: 400 }
    );
  }

  // Step 1 — Arc settlement: the operator (symbolic "client") pays clientPaymentAmount
  // and the pool distributes USDC to investors proportionally + the agent fee.
  let arcTxHash: string;
  try {
    ({ txHash: arcTxHash } = await settlePool(poolAddress));
  } catch {
    return NextResponse.json(
      { error: 'Could not complete settlement on the payment network. Please try again.' },
      { status: 502 }
    );
  }

  await gap();

  // Steps 2-3 — Hedera HSS: create the distribution schedule (60/40 split of the HTS
  // supply to the two pre-associated investor accounts), then execute it with the
  // settlement-trigger signature. ARC ALREADY SETTLED and can't be rolled back, so a
  // Hedera failure here is a PARTIAL SUCCESS (502 with what landed).
  let scheduleId: string;
  let scheduleExecTxId: string;
  let hashscanScheduleUrl: string;
  try {
    const operatorId = process.env.HEDERA_OPERATOR_ID!;
    const inv1Id = process.env.HEDERA_INVESTOR1_ID!;
    const inv2Id = process.env.HEDERA_INVESTOR2_ID!;
    const trigId = process.env.HEDERA_SETTLEMENT_TRIGGER_ID!;
    const trigKey = PrivateKey.fromStringDer(process.env.HEDERA_SETTLEMENT_TRIGGER_KEY!);

    const supply = invoice.amountUsd * 100; // token has 2 decimals
    const amt1 = Math.floor(supply * 0.6);
    const amt2 = supply - amt1;

    const sched = await withRetry(() =>
      scheduleDistribution({
        tokenId,
        recipients: [
          { accountId: inv1Id, amount: amt1 },
          { accountId: inv2Id, amount: amt2 },
        ],
        treasuryAccountId: operatorId,
        settlementTrigger: { accountId: trigId, publicKey: trigKey.publicKey },
      })
    );
    scheduleId = sched.scheduleId;
    (invoice as any).scheduleId = scheduleId;

    await gap();
    const exec = await withRetry(() => executeSchedule(scheduleId, trigKey));
    scheduleExecTxId = exec.txId;
    hashscanScheduleUrl = exec.hashScanUrl;
  } catch {
    // Arc settled but the Hedera distribution failed — record the partial state.
    (invoice as any).status = 'settled';
    (invoice as any).settleTxHash = arcTxHash;
    (invoice as any).settledAt = new Date().toISOString();
    store.invoices.set(params.invoiceId, invoice);
    return NextResponse.json(
      {
        error: 'Payment settled, but the distribution schedule could not be completed.',
        partial: true,
        arcTxHash,
        arcscanUrl: `https://testnet.arcscan.app/tx/${arcTxHash}`,
      },
      { status: 502 }
    );
  }

  // Step 4 — Reputation tick (in-memory). Activates calculateAgentScore().
  const agent = [...store.agents.values()].find(
    (a) => a.name === (invoice as any).acceptedAgentName
  );
  let agentReputationBefore: number | null = null;
  let agentReputationAfter: number | null = null;
  if (agent) {
    agentReputationBefore = agent.reputation.score;
    agent.reputation.completedDeals += 1;
    agent.reputation.successfulSettlements += 1;
    agent.reputation.daysSinceLastDeal = 0;
    agent.reputation.score = calculateAgentScore(agent.reputation);
    agentReputationAfter = agent.reputation.score;
    store.agents.set(agent.id, agent);
  }

  // Finalize the invoice.
  (invoice as any).status = 'settled';
  (invoice as any).settleTxHash = arcTxHash;
  (invoice as any).scheduleExecTxHash = scheduleExecTxId;
  (invoice as any).settledAt = new Date().toISOString();
  store.invoices.set(params.invoiceId, invoice);

  // Symbolic dollar figures for the cascade UI (on-chain amounts are small USDC).
  const winningBid = (store.bids.get(params.invoiceId) || []).find(
    (b) => b.agentName === (invoice as any).acceptedAgentName
  );
  const distributedToAgentUsd = winningBid?.agentEarnings ?? 0;
  const distributedToInvestorsUsd = invoice.amountUsd - distributedToAgentUsd;

  return NextResponse.json({
    arcTxHash,
    arcscanUrl: `https://testnet.arcscan.app/tx/${arcTxHash}`,
    hederaScheduleExecTxId: scheduleExecTxId,
    hashscanScheduleUrl,
    agentReputationBefore,
    agentReputationAfter,
    distributedToAgentUsd,
    distributedToInvestorsUsd,
  });
}
