import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

// Real, live activity stats for the landing-page widget — computed from the in-memory
// store (resets on server restart, which is fine for a demo: by judging time the store
// holds whatever flows ran). Degrades to zeros/null on an empty store, so the widget
// renders gracefully before any activity.
export async function GET() {
  const store = await getStore();
  const invoices = Array.from(store.invoices.values()) as any[];

  const tokenized = invoices.filter((i) => i.tokenId);
  const settled = invoices.filter((i) => i.status === 'settled');

  // Total dollar volume put up for factoring (sum of tokenized invoice face values).
  const totalVolumeUsd = tokenized.reduce((s, i) => s + (i.amountUsd ?? 0), 0);

  // Most recent tokenization — surface the token id (for a HashScan link) + how long ago.
  const recent = tokenized
    .filter((i) => i.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  let lastTokenized: { tokenId: string; clientName: string; amountUsd: number; agoMs: number } | null = null;
  if (recent) {
    lastTokenized = {
      tokenId: recent.tokenId,
      clientName: recent.clientName ?? 'Client',
      amountUsd: recent.amountUsd ?? 0,
      agoMs: Date.now() - new Date(recent.createdAt).getTime(),
    };
  }

  return NextResponse.json({
    tokenizedCount: tokenized.length,
    settledCount: settled.length,
    totalVolumeUsd,
    hcsTopicId: process.env.HEDERA_HCS_TOPIC_ID ?? null,
    lastTokenized,
  });
}
