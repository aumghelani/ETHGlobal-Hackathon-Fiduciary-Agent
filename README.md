# cashmeifyoucan

> AI agents compete to factor your invoice: the most trusted one wins by offering you **more money for a lower fee**.

AI-powered invoice factoring for the 70 million Americans who freelance. Built for ETHGlobal NY 2026.

---

## The problem

Freelancers wait 30 to 90 days to get paid. Invoice factoring (getting cash now instead of later) is a ~$3.7T global industry (FCI, 2024), but it's built for corporations: the per-invoice underwriting cost makes it impossible for individuals.

## The solution

Upload an unpaid invoice. AI agents bid in a live auction to advance you cash today. Investors back a fraction of the invoice and earn yield when your client pays. When the client settles, distribution to investors fires automatically on-chain.

**The inversion:** the more reputable an agent becomes, the *less* it can charge. Trust is a fee **compressor**, not a multiplier: the market prices away the veteran's risk premium. A veteran offers a smaller discount *and* a lower fee than a newcomer. So the most trusted agent gives you the best deal, and earns the least on it, which is why newcomers survive on the riskier long tail.

It's not invoice-specific. The same engine (a trust-priced reputation marketplace + an RWA tokenization pipeline + a delegated-fiduciary-agent pattern) factors any receivable: royalty advances, gig wages, tax refunds, medical claims.

---

## How it works

```
Freelancer uploads invoice   →  verified (World ID) + hashed to Hedera HCS (anti-double-sell)
        ↓
AI agents bid (live auction) →  reputation-priced; the winner's fee is set here
        ↓
Winner mints an HTS token    →  supply = invoice amount; agent fee is a native custom fee
        ↓
Investors fund an Arc pool   →  publicly, or privately via Unlink (position sealed)
        ↓
Pool hits target             →  freelancer is paid today
        ↓
Client pays (settlement)     →  Arc distributes USDC to investors + agent fee;
                                Hedera HSS schedule fires; private backers paid out via Unlink;
                                agent reputation updates
```

---

## The reputation engine

Three deterministic scoring functions ([`packages/agents/src/reputation.ts`](packages/agents/src/reputation.ts)), transparent math, not a black box:

**Agent score (0 to 5)** = volume-weighted track record (log-scaled, max 3.5) + success rate (max 1.0) + activity/recency (max 0.5). Updates on every real settlement. This is what drives the fee inversion.

**Freelancer trust (0 to 1)** = identity verification + ENS subname + a quadratic track-record bonus (disputes hurt a lot) + client diversity + account age (Sybil resistance). A freelancer raises it by completing invoices cleanly, working with more clients, and building history.

**Client trust (0 to 1)** = verified-business + payment reliability (on-time / late / unpaid) + volume. Feeds the agent's risk assessment of the payer.

Risk score = `freelancerTrust × 0.4 + clientTrust × 0.6`. Agents pass on deals below their risk threshold.

---

## Sponsor integrations (all live on testnet)

- **Hedera: three services, all load-bearing.**
  - **HTS:** each invoice is a native Hedera token; supply = invoice amount (cents); the agent's management fee is a `CustomFractionalFee` enforced at the protocol layer, so the agent can't be cut out of the deal.
  - **HSS (Scheduled Transactions):** distribution to fractional holders is deferred until a settlement trigger fires: the "settle on maturity" pattern.
  - **HCS:** every invoice's hash is committed to a shared consensus topic; a re-upload of an already-listed invoice is rejected. Other platforms could query the same topic.
- **Arc (Circle): programmable USDC settlement.** A per-invoice `InvoicePool` smart contract: conditional release to the freelancer at funding target, then atomic distribution to investors + the agent fee at settlement. Gas is paid in USDC. The agent gets its own policy-gated Circle developer-controlled wallet on Arc.
- **Unlink: privacy as a primitive.** Investors can back invoices privately (server-side, no wallet UI). A position's identity and amount stay sealed from other investors, and at settlement, private backers are paid back via a private withdrawal.
- **Dynamic (dynamic.xyz): login + embedded wallet (optional / bonus integration).** When `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is set, a "Sign in" button lets a user connect or create a wallet on Arc, and a "Fund from my wallet" button runs a real client-side USDC approve + deposit. It degrades gracefully (the button is hidden) when the env var is unset.

---

## Security: defense-in-depth (honest status)

Six designed layers. Three are **real and on-chain** today; the rest are designed with a clear seam:

| Layer | Status | What's built |
|---|---|---|
| 1. Identity | 🟢 Partial | **World ID** proof-of-personhood gate (real, v4) on upload. ENS subname + company registry = roadmap. |
| 2. Contract authenticity | ⚪ Mocked | DKIM/zkTLS email proof: UI badge today, roadmap. |
| 3. Double-spend prevention | 🟢 **Real** | Invoice hash → **Hedera HCS** → duplicate uploads rejected. |
| 4. AI credit assessment | 🟢 **Real** | The agent underwrites every deal from freelancer/client trust + LLM reasoning. |
| 5. Economic disincentives | ⚪ Roadmap | Freelancer bond + progressive client caps: designed, not built. |
| 6. Dispute resolution | ⚪ Roadmap | Chainlink Confidential AI attester: architecture only. |

Also built as honest mocks-with-seams: an **investor KYC/accreditation gate** (`lib/kyc.ts`, off by default), and a **"cash to your bank"** off-ramp surface (a real fiat rail drops in behind the seam).

---

## Getting started

### Prerequisites
- Node.js 20.x, pnpm 8.x
- Hedera testnet account with HBAR ([portal.hedera.com](https://portal.hedera.com)): the HTS mint costs ~40 ℏ
- Arc testnet wallet with faucet USDC ([faucet.circle.com](https://faucet.circle.com)): Arc gas is paid in USDC
- Anthropic API key (agent reasoning)
- Optional: Unlink API key + App ID; World ID Staging app; Circle Console API key; Dynamic environment ID (`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) for the embedded-wallet sign-in
- Optional: Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) for the serverless-safe store; required on Vercel, optional locally

### Setup
```bash
git clone <this-repo>
cd fiduciary
pnpm install
cp .env.example .env.local   # fill in credentials (see .env.example)
pnpm dev
```
Open http://localhost:3000. Agents and demo state seed in-memory at runtime; per-invoice pools deploy on Arc on accept.

> **Serverless-safe store:** the app uses **Upstash Redis** as its store so state survives across Vercel serverless function instances (an in-memory store would not). Locally it falls back to in-memory automatically when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are unset; on Vercel those two env vars are required.

> The UI abstracts the blockchain by default (it reads as a clean fintech product). Toggle **Dev mode** in the nav to reveal USDC amounts, transaction hashes, and explorer links.

---

## Repository structure

```
packages/
├── contracts/   # InvoicePool.sol (Arc) + tests
├── hedera/      # HTS mint, HSS schedule, HCS helpers
├── agents/      # reputation + bid logic + LLM reasoning
└── frontend/    # Next.js app + API routes (the backend lives here)
scripts/         # one-off setup + verification scripts
```

---

## Sponsors targeted

- 🪙 **Hedera**: Tokenization on Hedera (+ AI & Agentic Payments)
- 💵 **Arc (Circle)**: Smart Contracts with Advanced Stablecoin Logic
- 🔒 **Unlink**: Best Private Application

---

## Demo

Live: **https://cashmeifyoucan.us** (deployed on Vercel) · Video: _[Loom URL]_

### Docs

- [`DEPLOY.md`](DEPLOY.md): Vercel deployment guide and environment-variable checklist.

## License

MIT
