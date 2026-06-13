# Fiduciary

> AI-powered invoice factoring for the 70 million Americans who freelance.

Built for ETHGlobal NY 2026.

---

## The Problem

Freelancers wait 30-90 days to get paid. Invoice factoring exists for corporations but excludes individuals because the per-invoice underwriting cost is too high.

## The Solution

AI agents compete in a live auction to factor a freelancer's invoice. The freelancer gets cash today. Investors buy fractional tokens and earn yield when the client pays.

**The twist:** The more reputable an AI agent becomes, the LESS it can charge. Trust is a fee compressor, not multiplier — because the market correctly prices away risk premium.

---

## Architecture

```
Frontend (Next.js)
    ↓
Backend (Next.js API routes)
    ↓
┌──────────┬──────────┬──────────┐
│  Hedera  │   Arc    │  Unlink  │
│  (Token) │  (USDC)  │ (Privacy)│
└──────────┴──────────┴──────────┘
```

- **Hedera** — three services: HTS (each invoice is a native token, supply = invoice amount, agent fee as a protocol-level custom fractional fee), HSS (scheduled distribution fires at settlement), HCS (invoice-hash audit log for double-spend prevention)
- **Arc (Circle)** — an InvoicePool smart contract on Arc: conditional release at funding target, then programmable USDC distribution to investors + agent fee at settlement. The agent gets its own policy-gated Circle developer-controlled wallet on Arc.
- **Unlink** — private investor deposits (server-side, no wallet UI); a position's identity and amount stay sealed from other investors

---

## Getting Started

### Prerequisites
- Node.js 20.x
- pnpm 8.x
- Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))
- Arc testnet account + faucet USDC
- Anthropic API key

### Setup
```bash
git clone <this-repo>
cd fiduciary
pnpm install
cp .env.example .env.local
# Fill in .env.local with your credentials
```

### Run
```bash
pnpm dev
```

Open http://localhost:3000

Agents and demo state are seeded in-memory at runtime — no seed step needed. Per-invoice pools deploy on Arc when an offer is accepted.

---

## Repository Structure

```
fiduciary/
├── packages/
│   ├── contracts/     # Solidity for Arc
│   ├── hedera/        # Hedera SDK wrappers
│   ├── agents/        # AI agent logic
│   ├── backend/       # API server
│   └── frontend/      # Next.js UI
└── scripts/           # Deploy + demo scripts
```

---

## Sponsors

This project targets three ETHGlobal NY 2026 partner tracks:

- 🪙 **Hedera** — Tokenization on Hedera
- 💵 **Arc (Circle)** — Smart Contracts with Advanced Stablecoin Logic
- 🔒 **Unlink** — Best Overall Privacy App

---

## Demo

Live: [deployment URL]
Video: [Loom URL]

---

## License

MIT

---

## Acknowledgments

Inspired by 3Jane (uncollateralized USDC lending) and the broader 2026 thesis that real-world financial flows belong on-chain.
