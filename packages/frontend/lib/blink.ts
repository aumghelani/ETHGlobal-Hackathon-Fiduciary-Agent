// Blink (blink.cash) — STUB module. ISOLATED sponsor candidate, NOT wired in.
//
// RECON BLOCKER (docs/BLINK_RECON.md): Blink is a DEPOSIT sdk ("pull stablecoins from
// the user's wallet into your app"), NOT a USDC→USD bank off-ramp. It has no fiat/bank
// rail at all, and it does NOT support Arc (chainId 5042002) — sandbox is Base Sepolia
// only. So the "$X sent to Maria's bank" off-ramp we wanted CANNOT be done with Blink.
//
// Rather than fake a capability Blink doesn't have, this is a STUB: offrampUsdcToBank()
// returns a clearly-mocked confirmation shape with TODO markers. If we instead want
// Blink's $5k track, we'd build a REAL blinkDeposit() (investors fund the app in USDC),
// but on Base Sepolia — not Arc. See the recon doc for that path.

export interface OfframpConfirmation {
  // Mocked shape — what a real off-ramp provider (NOT Blink) would return.
  status: 'mocked';
  amountUsdc: number;
  destinationBankAccountId: string;
  // A real provider returns a payout/transfer id + an ETA; these are placeholders.
  payoutId: string;
  estimatedArrival: string;
  note: string;
}

// STUB: pretend-off-ramp. Does NOT call Blink (Blink can't off-ramp to fiat). Returns a
// mocked confirmation so a caller's code path can be exercised. Replace with a real
// fiat-capable provider (Circle payouts / Bridge / Crossmint) to actually move money.
export async function offrampUsdcToBank(
  amountUsdc: number,
  sandboxBankAccountId: string
): Promise<OfframpConfirmation> {
  // TODO(user-decision): Blink does not provide a fiat off-ramp. Pick a real provider.
  // TODO: if keeping the narrated mock (ADR-008), this stub is the integration point.
  return {
    status: 'mocked',
    amountUsdc,
    destinationBankAccountId: sandboxBankAccountId,
    payoutId: 'mock_payout_PENDING_REAL_PROVIDER',
    estimatedArrival: '1-2 business days (mocked)',
    note:
      'STUB — Blink is a deposit SDK with no fiat off-ramp and no Arc support. ' +
      'Wire a fiat-capable provider here, or keep "$X to Maria\'s bank" as narrated UX (ADR-008).',
  };
}

export interface BlinkDepositResult {
  status: 'mocked' | 'completed';
  amountUsd: number;
  // A real Blink deposit returns a transfer id + status; chainId 84532 = Base Sepolia.
  transferId: string;
  chainId: number;
  note: string;
}

// INVESTOR-SIDE deposit via Blink. STUB-WITH-SEAM: Blink's deposit DOES work for real,
// but only on Base Sepolia (NOT Arc), needs the @swype-org/deposit SDK + a backend ECDSA
// signer endpoint + a (sandbox auto-approved) merchant. That's a separate funding rail on
// a different chain — out of scope for the Arc pool. This returns a mocked confirmation so
// the UI path is exercised; the seam below is exactly where the real SDK drops in.
export async function blinkInvestorDeposit(amountUsd: number): Promise<BlinkDepositResult> {
  // SEAM — to make real (Base Sepolia):
  //   import { Deposit } from '@swype-org/deposit';
  //   const deposit = new Deposit({ signer: '/api/blink/sign' });   // backend ECDSA P-256 signer
  //   const { transfer } = await deposit.requestDeposit({
  //     amount: amountUsd, chainId: 84532, address: <merchant wallet>, token: <Base Sepolia USDC>,
  //   });
  //   return { status: 'completed', amountUsd, transferId: transfer.id, chainId: 84532, note: '...' };
  return {
    status: 'mocked',
    amountUsd,
    transferId: 'mock_blink_transfer_BASE_SEPOLIA',
    chainId: 84532,
    note:
      'STUB — real Blink deposit runs on Base Sepolia (not Arc) via @swype-org/deposit. ' +
      'Sandbox merchant auto-approves at api-sandbox.blink.cash. Seam in lib/blink.ts.',
  };
}
