import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPoolState, settlePool } from '@/lib/arc';
import { scheduleDistribution, executeSchedule, PrivateKey } from '@fiduciary/hedera';
import { calculateAgentScore } from '@fiduciary/agents';
import { withRetry } from '@/lib/retry';
import { privatePayoutOnUnlink } from '@/lib/unlink';

// Small spacing between sequential on-chain operations — eases RPC pressure and
// gives the network a beat between txns (per demo tuning).
const gap = () => new Promise((r) => setTimeout(r, 2000));

// Settle chains Arc settlement → Hedera schedule create+execute → private payout, with
// retries and 2s gaps — well over Vercel's default 10s. 60s is the Hobby ceiling; without
// this the function is killed mid-flight (Arc would settle but the response would 502).
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const store = await getStore();
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

    // Reuse a schedule from a prior attempt if one was already created (create succeeded
    // but execute failed) — avoids leaving a duplicate PENDING schedule on a re-run.
    if ((invoice as any).scheduleId) {
      scheduleId = (invoice as any).scheduleId;
    } else {
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
      store.invoices.set(params.invoiceId, invoice);
    }

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
    await store.flush();
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

  // Step 3.5 — Private payout (Track E). If this invoice had any private (Unlink) deposits,
  // withdraw the aggregate private USDC out of the shared privacy position to a custodian
  // address (PRIVATE_PAYOUT_ADDRESS, default operator). NOT per-investor — privateDeposits
  // store no recipient (privacy). BEST-EFFORT + non-blocking: Arc already settled, so a
  // payout failure must not break settlement (mirrors the Circle-provision pattern). ADR-024.
  const privateDeposits = ((invoice as any).privateDeposits ?? []) as Array<{ amountUsdc?: string }>;
  let privatePayoutTxHash: string | null = null;
  if (privateDeposits.length > 0) {
    try {
      const totalPrivateUsdc = privateDeposits.reduce(
        (s, p) => s + (p.amountUsdc ? BigInt(p.amountUsdc) : 0n),
        0n
      );
      if (totalPrivateUsdc > 0n) {
        const recipient = process.env.PRIVATE_PAYOUT_ADDRESS || process.env.FREELANCER_ADDRESS!;
        const { txHash } = await privatePayoutOnUnlink({
          recipientEvmAddress: recipient,
          amountUsdc: totalPrivateUsdc,
        });
        privatePayoutTxHash = txHash;
        (invoice as any).privatePayoutTxHash = txHash;
        store.invoices.set(params.invoiceId, invoice);
      }
    } catch (err) {
      console.error('[settle] private payout failed (non-fatal):', err);
    }
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
  await store.flush(); // persist settled state + reputation before responding

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
    // Private payout (Track E) — null if there were no private deposits.
    privatePayoutTxHash,
    privatePayoutUrl: privatePayoutTxHash ? `https://testnet.arcscan.app/tx/${privatePayoutTxHash}` : null,
  });
}
