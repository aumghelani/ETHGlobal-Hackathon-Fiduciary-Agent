import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

// DEV-ONLY: clears the World ID nullifier set so the same tester can factor invoices
// repeatedly without the one-per-human gate locking them out during development.
//
// HARD-GUARDED so it can NEVER weaken Sybil resistance in a real deployment:
//   1) It does nothing unless ALLOW_DEV_RESET=true is explicitly set in the env.
//   2) Even then, the request must carry the matching DEV_RESET_TOKEN
//      (header `x-dev-reset-token` or `?token=`).
// In production these are simply not set, so this route returns 403 and is inert.
export async function POST(req: NextRequest) {
  if (process.env.ALLOW_DEV_RESET !== 'true') {
    return NextResponse.json(
      { error: 'Disabled. Set ALLOW_DEV_RESET=true to enable this dev-only route.' },
      { status: 403 }
    );
  }

  const expected = process.env.DEV_RESET_TOKEN;
  const provided =
    req.headers.get('x-dev-reset-token') ?? new URL(req.url).searchParams.get('token');
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { error: 'Invalid or missing dev reset token.' },
      { status: 403 }
    );
  }

  const store = await getStore();
  const cleared = await store.nullifiers.clear();
  console.warn(`[dev] ⚠️  reset-nullifiers: cleared ${cleared} World ID nullifier(s).`);

  return NextResponse.json({ ok: true, clearedNullifiers: cleared });
}
