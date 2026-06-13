import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { getClient } from "./client.js";

// HCS = the third Hedera primitive (HTS for tokenization, HSS for scheduled
// distribution, HCS here for the double-spend audit log, THREAT_MODEL Layer 3).
// Every invoice's SHA-256 file hash is written to ONE shared topic at upload;
// a re-submission of an already-seen hash is rejected upstream.

// Local retry for transient Hedera/mirror-node blips (ADR-016 semantics).
// Defined inline rather than importing the frontend's lib/retry.ts: the hedera
// package must not depend on the frontend (wrong dependency direction). Same
// shape as withRetry(fn, 3, 2000ms).
async function withRetry<T>(fn: () => Promise<T>, tries = 3, delayMs = 2000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function requireTopicId(): string {
  const id = process.env.HEDERA_HCS_TOPIC_ID;
  if (!id || id.trim() === "") {
    throw new Error(
      "Missing HEDERA_HCS_TOPIC_ID. Run scripts/create-hcs-topic.ts and add it to .env.local."
    );
  }
  return id.trim();
}

// Submit one invoice hash to the shared topic. Returns the consensus sequence
// number + timestamp from the receipt. Retried (connect blips are pre-submission).
export async function submitInvoiceHash(
  hash: string
): Promise<{ sequenceNumber: number; consensusTimestamp: string }> {
  return withRetry(async () => {
    const topicId = requireTopicId();
    const client = getClient();
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(hash)
      .execute(client);
    const receipt = await tx.getReceipt(client);

    // topicSequenceNumber is a Long; consensus timestamp comes from the record.
    // Throw on a null sequence rather than recording a fake 0 (a real seq 0 is
    // indistinguishable from a failure, which would corrupt the double-spend audit).
    // The caller fails open, so the invoice is still created — just without the hcs fields.
    if (receipt.topicSequenceNumber === null || receipt.topicSequenceNumber === undefined) {
      throw new Error(
        `HCS submit receipt has no topicSequenceNumber (status: ${receipt.status.toString()}).`
      );
    }
    const sequenceNumber = receipt.topicSequenceNumber.toNumber();
    const record = await tx.getRecord(client);
    const consensusTimestamp = record.consensusTimestamp.toString();

    return { sequenceNumber, consensusTimestamp };
  });
}

// Check whether a hash is already on the topic, via the Mirror Node REST API.
// FAILS OPEN: if the mirror node is unreachable (timeout / 5xx), returns false
// rather than blocking a legitimate upload — we'd rather miss a duplicate than
// reject a real invoice on mirror-node flakiness (safer-default-on-failure).
//
// Mirror-node lag: new messages typically appear within 3-5s of consensus, so a
// tight upload->upload loop may not yet see the first message. Acceptable for the demo.
export async function isHashAlreadySubmitted(hash: string): Promise<boolean> {
  const topicId = requireTopicId();
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100`;

  try {
    return await withRetry(async () => {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        throw new Error(`Mirror node returned ${res.status}`);
      }
      const data = (await res.json()) as {
        messages?: Array<{ message: string }>;
      };
      const messages = data.messages ?? [];
      for (const m of messages) {
        // message is base64-encoded; decode and compare to the provided hash.
        const decoded = Buffer.from(m.message, "base64").toString("utf8");
        if (decoded === hash) return true;
      }
      return false;
    });
  } catch (err) {
    // Fail open — do not block uploads on mirror-node availability.
    console.error(
      `[hcs] isHashAlreadySubmitted: mirror node unreachable, failing open (allowing upload):`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}
