// Blink spike — exercises the STUB shape that packages/frontend/lib/blink.ts implements.
// Self-contained so it runs under plain `tsx`. Mirrors lib/blink.ts.
//
// RECON BLOCKER (docs/BLINK_RECON.md): Blink is a DEPOSIT sdk, not a USDC→USD off-ramp,
// and does NOT support Arc. There is nothing live to call for an off-ramp — this spike
// proves the stub's code path runs and surfaces the blocker. It does NOT hit Blink (that
// would require pretending Blink can off-ramp, which it can't).

// Inlined mirror of lib/blink.ts offrampUsdcToBank (STUB).
async function offrampUsdcToBank(amountUsdc: number, sandboxBankAccountId: string) {
  return {
    status: 'mocked' as const,
    amountUsdc,
    destinationBankAccountId: sandboxBankAccountId,
    payoutId: 'mock_payout_PENDING_REAL_PROVIDER',
    estimatedArrival: '1-2 business days (mocked)',
    note:
      'STUB — Blink is a deposit SDK with no fiat off-ramp and no Arc support. ' +
      'Wire a fiat-capable provider here, or keep "$X to Maria\'s bank" as narrated UX (ADR-008).',
  };
}

async function main() {
  console.log('=== Blink off-ramp spike (STUB) ===');
  console.log(
    '\n⚠️  RECON BLOCKER: Blink (blink.cash, @swype-org/deposit) is a DEPOSIT sdk — it pulls\n' +
      '   stablecoins from a user wallet INTO your app. It has NO fiat/bank off-ramp and does\n' +
      '   NOT support Arc (chainId 5042002; sandbox is Base Sepolia only). The "$X to Maria\'s\n' +
      '   bank" off-ramp CANNOT be done with Blink. This spike runs the STUB only.\n'
  );

  const result = await offrampUsdcToBank(4900, 'sandbox-bank-acct-001');
  console.log('Stub returned:', JSON.stringify(result, null, 2));

  if (result.status === 'mocked') {
    console.log(
      '\n✅ STUB SHAPE VERIFIED — the off-ramp code path runs and returns the expected shape.\n' +
        '   To make it REAL: (a) wire a fiat-capable provider (Circle payouts / Bridge / Crossmint)\n' +
        '   for the bank leg, OR (b) repurpose Blink as a DEPOSIT flow on Base Sepolia for its $5k\n' +
        '   track (see docs/BLINK_RECON.md). Either is a user decision.'
    );
  } else {
    console.error('❌ Unexpected stub result.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Spike failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
