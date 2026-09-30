# Fiduciary Agent (cashmeifyoucan)

Invoice factoring marketplace where AI underwriting agents bid on freelancer invoices, with USDC settlement on Arc, tokenization on Hedera and private investing through Unlink.

Built at ETHGlobal New York 2026. Live demo (testnet): https://fiduciary-agent.vercel.app

## Overview

Freelancers often wait 30 to 90 days for clients to pay. Invoice factoring means selling an unpaid invoice now for a discount. It is common for businesses but rarely offered to individuals, because underwriting each small invoice costs too much.

cashmeifyoucan automates that underwriting:

1. A freelancer uploads an invoice and proves they are a unique human with World ID.
2. Competing agents bid a discount and a management fee. Each bid is priced from the agent's reputation and the risk of the freelancer and client.
3. The accepted bid mints an invoice token on Hedera and deploys a USDC pool contract on Arc.
4. Investors fund the pool, either publicly or privately. When the pool reaches its target, the freelancer is paid.
5. When the invoice is settled, the pool pays investors in proportion to their deposits, pays the agent its fee, and updates the agent's reputation.

The core design is a fee inversion. A higher agent reputation lowers the fee and discount that agent can offer, so the most trusted agent gives the freelancer the best deal.

## Key Features

- **Reputation-priced auction**: deterministic, transparent scoring in `packages/agents/src/reputation.ts`:
  - Agent score (0-5): log-scaled volume (max 3.5), success rate (max 1.0) and recency (max 0.5).
  - Freelancer trust (0-1): identity, quadratic clean-record bonus, client diversity and account age.
  - Client trust (0-1): verified business, payment reliability and volume.
  - Risk = `0.4 * freelancerTrust + 0.6 * clientTrust`. An agent passes on an invoice below its risk threshold.
- **LLM-written bid reasoning**: each agent's bid numbers come from the deterministic math. An LLM API call then writes a short explanation for the freelancer. If the call fails, the app falls back to a deterministic explanation.
- **World ID 4.0 identity gate**: proofs are verified server-side when an invoice is uploaded and can be bound to the connected wallet. The World ID nullifier ties a freelancer's track record to one human, so it can't be reset by switching wallets.
- **Hedera (three services)**:
  - HTS: one token per invoice, with the agent fee as a native `CustomFractionalFee`.
  - HCS: invoice file hashes and agent decisions are written to a shared topic, and re-uploads of a known hash are rejected.
  - Scheduled Transactions: the token distribution is deferred until settlement.
- **Arc (Circle) USDC pool**: the per-invoice `InvoicePool.sol` contract releases funds to the freelancer at the funding target, and distributes proportionally with an agent fee at settlement. Gas is paid in USDC.
- **Private investing with Unlink**: investors can fund privately. Private amounts are hidden from other viewers in the API, but each investor can still see their own position.
- **Optional integrations**: Dynamic login with an embedded wallet for client-side USDC funding, a Circle developer-controlled wallet for the winning agent, and an investor KYC gate (mocked).
- **Serverless-safe state**: Upstash Redis on Vercel, with an automatic in-memory fallback for local development.
- **Dev mode toggle**: shows USDC amounts, transaction hashes and explorer links behind the default fintech-style UI.

## Architecture / How It Works

```
Freelancer uploads invoice --> World ID proof verified, file hash checked/committed on Hedera HCS
        |
        v
Agents bid (auction) ------> deterministic risk + reputation pricing, LLM-written reasoning
        |
        v
Accept winning bid --------> HTS invoice token minted (agent fee as custom fee)
                             InvoicePool deployed on Arc, decision logged to HCS
        |
        v
Investors fund ------------> public USDC deposit into InvoicePool, or private deposit via Unlink
        |
        v
Pool reaches target -------> InvoicePool transfers the advance to the freelancer
        |
        v
Settlement ----------------> InvoicePool pays investors pro rata + agent fee
                             Hedera scheduled distribution executes
                             private (Unlink) balance withdrawn, agent reputation updated
```

The backend is a set of Next.js API routes in `packages/frontend/app/api/` (`invoices`, `auctions/[id]/start|accept`, `invest/[id]/fund|fund-private|fund-blink`, `settle/[id]`, `kyc/verify`, `worldid/context`, `stats`). They call the `@fiduciary/agents` and `@fiduciary/hedera` workspace packages and the chain helpers in `packages/frontend/lib/`. See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full diagrams.

## Tech Stack

- TypeScript, Node.js 20, pnpm workspaces
- Next.js 14 (App Router), React 18, Tailwind CSS, Radix UI, Framer Motion
- Solidity 0.8.24, Hardhat, OpenZeppelin, Mocha, Chai
- ethers.js v6, viem
- Hedera SDK: Hedera Token Service (HTS), Hedera Consensus Service (HCS), Scheduled Transactions
- Arc testnet (Circle), USDC, Circle Developer-Controlled Wallets
- Unlink SDK (private deposits and withdrawals)
- World ID 4.0 (IDKit)
- Dynamic (wallet authentication)
- Upstash Redis
- LLM API
- Vercel

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 8+
- A Hedera testnet account with HBAR (from portal.hedera.com)
- An Arc testnet wallet with faucet USDC (from faucet.circle.com). Arc gas is paid in USDC.
- An LLM API key for agent reasoning (the variable is listed in `.env.example`)
- Optional: Unlink, World ID, Circle Developer Console and Dynamic credentials, plus Upstash Redis (required on Vercel)

### Setup

```bash
git clone https://github.com/aumghelani/ETHGlobal-Hackathon-Fiduciary-Agent.git
cd ETHGlobal-Hackathon-Fiduciary-Agent
pnpm install
cp .env.example .env.local        # fill in credentials; every package reads the root .env.local
pnpm exec tsx scripts/create-hcs-topic.ts   # one-time: prints HEDERA_HCS_TOPIC_ID to add to .env.local
pnpm dev                          # starts the Next.js app on http://localhost:3000
```

The two demo agents and the app state are seeded at runtime. A per-invoice pool is deployed on Arc when a bid is accepted.

Demo switches in `.env.example` (all off by default): `DEMO_BYPASS_WORLDID` lets you run the flow without a World ID account, and `KYC_ENABLED` / `DEMO_BYPASS_KYC` control the mocked investor gate.

### Useful scripts

```bash
pnpm --filter @fiduciary/contracts compile       # compile InvoicePool / MockUSDC
pnpm --filter @fiduciary/contracts deploy:pool   # deploy a pool to Arc testnet
pnpm --filter @fiduciary/agents test:reputation  # print veteran vs newbie bids for a sample invoice
pnpm test:llm-bid                                # generate an LLM-backed bid
pnpm test:hedera-schedule                        # mint, schedule and execute a distribution on testnet
pnpm verify:arc-deploy                           # test deposit into a previously deployed Arc pool (address hardcoded)
```

Vercel deployment steps and the full environment checklist are in [`DEPLOY.md`](DEPLOY.md). A live walkthrough is in [`DEMO_GUIDE.md`](DEMO_GUIDE.md).

## Project Structure

```
packages/
  agents/      Reputation scoring, deterministic bid logic, LLM reasoning client
  hedera/      Hedera client, HTS mint, HCS hash log, scheduled distribution
  contracts/   InvoicePool.sol, MockUSDC.sol, Hardhat config, tests, deploy script
  frontend/    Next.js app: pages (upload, auction, invest, funded, settle, dashboard),
               API routes, and chain/identity helpers in lib/ (arc, unlink, worldid, kyc, store)
scripts/       One-off setup and integration spike scripts (HCS topic, Circle, Unlink, World ID)
ARCHITECTURE.md, DEPLOY.md, DEMO_GUIDE.md
```

## Testing

The Solidity contract has an automated test suite. It uses Hardhat and a mock USDC token, and covers deposit accumulation and release at target, proportional settlement with the agent fee, and reverts when settling an unfunded or already-settled pool or depositing into a funded one.

```bash
pnpm --filter @fiduciary/contracts test
```

The TypeScript packages and the frontend have no automated tests. The `scripts/test-*.ts` files are manual integration spikes that call real testnet services.

## Limitations and Roadmap

This is a hackathon prototype running on testnets. It is not production software.

- **HCS duplicate check fails open.** If the Hedera mirror node is unreachable, the upload is allowed. The check also reads only one page of 100 topic messages, and the mirror node can lag a few seconds behind new messages.
- **Bank off-ramp is a stub.** The "cash to your bank" step returns a mocked confirmation, and the Blink investor-deposit route is mocked too. No fiat moves.
- **KYC is mocked.** `verifyInvestor()` always passes and the gate is off by default.
- **Only the Solidity contract has tests.** Agents, Hedera helpers, API routes and UI are untested.
- **Demo data**: many freelancer and client trust inputs are fixed defaults. There are two seeded agents. Settlement is paid by the operator account acting as the client, and the Hedera distribution goes to two pre-associated demo investor accounts.
- **Private payouts are aggregated.** The private balance is withdrawn to one custodian address, not to each private investor.
- **The Circle agent wallet spending policy is recorded but not enforced.**
- **`InvoicePool.settle` has no caller restriction**, and the contract uses raw ERC-20 `transfer` calls without `SafeERC20`.
- **Designed but not built**: contract-authenticity proofs (DKIM/zkTLS), freelancer bonds and client caps, dispute resolution, and ENS subnames beyond a demo value.
