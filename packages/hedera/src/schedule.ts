import {
  TransferTransaction,
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  PrivateKey,
  PublicKey,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import { getClient } from "./client.js";

export interface ScheduleDistributionParams {
  tokenId: string;
  recipients: Array<{ accountId: string; amount: number }>;
  treasuryAccountId: string;
  // Dedicated signer whose signature is required to fire the schedule. In
  // production this is the settlement trigger (oracle / Chainlink CRE / agent);
  // for the demo it's an account we control. An HBAR ping leg makes it a sender
  // (net-negative) so the schedule stays PENDING until it signs.
  settlementTrigger: { accountId: string; publicKey: PublicKey };
  memo?: string;
}

export async function scheduleDistribution(
  params: ScheduleDistributionParams
): Promise<{ scheduleId: string; txId: string; hashScanUrl: string }> {
  const { tokenId, recipients, treasuryAccountId, settlementTrigger, memo } =
    params;
  const client = getClient();

  const transfer = new TransferTransaction();
  let total = 0;
  for (const r of recipients) {
    transfer.addTokenTransfer(tokenId, r.accountId, r.amount);
    total += r.amount;
  }
  transfer.addTokenTransfer(tokenId, treasuryAccountId, -total);

  // HBAR ping: settlementTrigger sends 1 tinybar to treasury. Being an HBAR
  // sender (net-negative) forces its signature, so the schedule sits PENDING
  // until executeSchedule supplies it.
  transfer.addHbarTransfer(
    settlementTrigger.accountId,
    Hbar.from(-1, HbarUnit.Tinybar)
  );
  transfer.addHbarTransfer(treasuryAccountId, Hbar.from(1, HbarUnit.Tinybar));

  const schedule = new ScheduleCreateTransaction()
    .setScheduledTransaction(transfer)
    .setScheduleMemo(memo ?? `Invoice ${tokenId} distribution`)
    .setMaxTransactionFee(new Hbar(5));

  const response = await schedule.execute(client);
  const receipt = await response.getReceipt(client);

  if (receipt.scheduleId === null) {
    throw new Error(
      `Schedule creation succeeded but receipt has no scheduleId (status: ${receipt.status.toString()}).`
    );
  }

  const scheduleId = receipt.scheduleId.toString();
  return {
    scheduleId,
    txId: response.transactionId.toString(),
    hashScanUrl: `https://hashscan.io/testnet/schedule/${scheduleId}`,
  };
}

export async function executeSchedule(
  scheduleId: string,
  signerKey: PrivateKey
): Promise<{ txId: string; hashScanUrl: string }> {
  const client = getClient();

  const signTx = await new ScheduleSignTransaction()
    .setScheduleId(scheduleId)
    .freezeWith(client)
    .sign(signerKey);

  try {
    const response = await signTx.execute(client);
    await response.getReceipt(client);
    return {
      txId: response.transactionId.toString(),
      hashScanUrl: `https://hashscan.io/testnet/schedule/${scheduleId}`,
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes("SCHEDULE_ALREADY_EXECUTED")) {
      throw new Error(
        `Schedule ${scheduleId} was already executed — was the settlementTrigger key used during create, or executeSchedule called twice?`
      );
    }
    throw err;
  }
}
