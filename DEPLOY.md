# Deploying Fiduciary to Vercel

The app is a pnpm monorepo; the deployable Next.js app is `packages/frontend` (it also
contains the API routes). The production build is verified green (`pnpm --filter
@fiduciary/frontend build`).

## 1. Serverless store (required)

Vercel runs each API route as a serverless function — **process memory is NOT shared
across requests**, so the in-memory store would 404 the moment you upload an invoice.
Provision a free **Upstash Redis** and set the two env vars below; the store then persists
across requests. (Locally, with no Upstash vars, the app falls back to in-memory and works
exactly as before.)

1. Create a Redis DB at <https://console.upstash.com>.
2. Copy the **REST URL** and **REST token**.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel.

## 2. Import the project on Vercel

1. New Project → import this Git repo.
2. **Root Directory:** set it to **`packages/frontend`** (Settings → General → Root Directory).
   This is required — Vercel's Next.js detection reads the Root Directory's `package.json`, and
   `next` lives in `packages/frontend/package.json`, not the repo root. Pointing it at the repo
   root fails with "No Next.js version detected".
3. Vercel detects the pnpm workspace and runs `install` from the monorepo root automatically, so
   the workspace deps (`@fiduciary/agents`, `@fiduciary/hedera`) link correctly. The committed
   `vercel.json` then runs `next build` inside the frontend dir.

## 3. Environment variables (Vercel → Settings → Environment Variables)

Copy the names from `.env.example`. The ones that make features go live:

**Store (required for the deployed app to work):**
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Hedera (HTS mint / HSS / HCS) — needs an account with ~100 ℏ:**
- `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY`, `HEDERA_NETWORK=testnet`
- `HEDERA_HCS_TOPIC_ID`
- `HEDERA_INVESTOR1_ID/KEY`, `HEDERA_INVESTOR2_ID/KEY`, `HEDERA_SETTLEMENT_TRIGGER_ID/KEY`

**Arc (USDC pool / settle) — wallet needs faucet USDC (gas is paid in USDC):**
- `ARC_RPC_URL`, `ARC_CHAIN_ID=5042002`, `ARC_PRIVATE_KEY`, `ARC_USDC_ADDRESS`
- `FREELANCER_ADDRESS`, `AGENT_ADDRESS`, `DEMO_POOL_TARGET_USDC` (optional)

**Agents:** `ANTHROPIC_API_KEY`

**Unlink (private deposit + payout):** `UNLINK_API_KEY`, `UNLINK_APP_ID`, `PRIVATE_PAYOUT_ADDRESS`

**World ID (identity gate, optional):** `WORLDID_APP_ID`, `WORLDID_ACTION`, `WORLDID_RP_ID`,
`WORLDID_SIGNING_KEY`, `NEXT_PUBLIC_WLD_APP_ID`, `NEXT_PUBLIC_WLD_ACTION`. To demo without a
real World ID account, set `DEMO_BYPASS_WORLDID=true` + `NEXT_PUBLIC_DEMO_BYPASS_WORLDID=true`.

**Dynamic wallet (login + wallet funding, optional):** `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`
(free Sandbox key from app.dynamic.xyz). Without it, login is hidden and funding stays server-side.

**Circle Agent Wallet (optional):** `CIRCLE_AGENT_API_KEY`, `CIRCLE_AGENT_ENTITY_SECRET`
(register the entity secret once — see scripts/register-circle-entity-secret.ts).

**KYC gate (optional, off by default):** `KYC_ENABLED`, `NEXT_PUBLIC_KYC_ENABLED`, `DEMO_BYPASS_KYC`.

> Every feature **degrades gracefully** when its keys are absent — the core flow
> (upload → auction → accept → fund → settle) only needs the Store + Hedera + Arc + Anthropic.

## 4. Deploy + verify

After deploy, walk the flow on the live URL: upload an invoice → run the auction → accept →
fund → settle. If an on-chain step fails, check the function logs (the accept route logs the
real cause, e.g. `INSUFFICIENT_PAYER_BALANCE` = the Hedera account needs HBAR, or low Arc USDC).

## Notes / limits

- Demo state lives in Redis; it persists across deploys until you flush the DB.
- The `/invest/[invoiceId]` page bundle is large (~1.2 MB) — Dynamic + viem + motion. Works, but heavy.
- This is testnet only. Secrets are operator keys — set them only in Vercel's env settings, never commit them.
