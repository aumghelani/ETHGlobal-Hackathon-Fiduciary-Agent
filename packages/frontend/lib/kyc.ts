// Investor KYC / accreditation gate. Distinct from World ID (which is proof-of-personhood
// for the FREELANCER on /upload). This gates INVESTORS before they can fund — the
// compliance story: only eligible/verified investors can back a receivable.
//
// HONEST MOCK-WITH-SEAM: today this returns a deterministic pass (clearly a demo). The
// interface is shaped so a real provider (Circle compliance / Persona / Sumsub / etc.)
// drops in behind verifyInvestor() without touching callers. KYC_ENABLED gates whether
// the check runs at all; DEMO_BYPASS_KYC short-circuits it for demos (mirrors
// DEMO_BYPASS_WORLDID). Default behavior must never block the demo.

export type InvestorKycInput = {
  // Whatever a real provider needs (a session token, a wallet, an email…). Loose on
  // purpose — the mock ignores it; a real adapter reads what it needs.
  reference?: string;
};

export type InvestorKycResult = {
  verified: boolean;
  // What was (or would be) checked — surfaced in Pro mode.
  checks: string[];
  // 'mock' today; becomes the provider name when a real one is wired.
  provider: 'mock' | string;
  reason?: string;
};

export function isKycEnabled(): boolean {
  // Off by default — turn on explicitly. (Even when on, DEMO_BYPASS_KYC can short-circuit.)
  return process.env.KYC_ENABLED === 'true';
}

export function isKycBypassed(): boolean {
  return process.env.DEMO_BYPASS_KYC === 'true';
}

// Verify an investor is eligible to fund. Mock: passes deterministically. Seam: replace
// the body with a real provider call and return the same shape.
export async function verifyInvestor(_input: InvestorKycInput = {}): Promise<InvestorKycResult> {
  // TODO(real-provider): call Circle compliance / Persona / Sumsub here and map the result.
  return {
    verified: true,
    checks: ['Eligible investor (sanctions + accreditation)', 'Region permitted'],
    provider: 'mock',
  };
}
