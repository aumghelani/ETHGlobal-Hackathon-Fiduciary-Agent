# Live Demo Guide (3 people, 3 devices)

How three of us run the full cashmeifyoucan flow live on **https://cashmeifyoucan.us**,
from our own devices and wallets, while spending the **minimum** testnet funds. Read this
once before judging.

## The roles

| Person | Device | Acts as | Page |
|---|---|---|---|
| **Person A** | their phone/laptop | Freelancer | `/upload` then `/funded/[id]` |
| **Person B** | their phone/laptop | Public investor | `/invest/[id]` |
| **Person C** | their phone/laptop | Private investor | `/invest/[id]` ("Buy privately") |

There are no account types in the app. The role you see (a badge in the top nav) is just
the page you are on. Each person connects their **own** wallet via the **Sign in** button
(Dynamic), so judges see three different real accounts.

## Cost: where the money actually comes from (important)

The on-chain amounts are tiny and **mostly paid by ONE shared operator wallet**, not by
each person. Specifically:

- The **"Buy a piece"** button funds from the server's operator wallet. **Person B and C
  spend nothing** when they use it. This is the default and the safe path for judging.
- The pool target is only about **10 USDC total** on-chain (the UI narrates the larger
  dollar figure; the real transfer is ~10 USDC).
- The Hedera token mint (~40 HBAR) is paid by the **operator**, not the demo wallets.
- Only the optional **"Fund from my wallet"** button spends a connected wallet's own USDC.

**So to stay minimal: everyone uses "Buy a piece" (server-funded).** Connecting your own
wallet still happens (real login, real address shown), but the deposit is server-paid, so
no one needs to top up their personal wallet. One operator wallet covers the whole run.

## One-time prep (do this BEFORE judging)

Only the operator wallet needs funding. Top it up generously so repeated runs don't run dry:

1. **Arc USDC** to the operator: get from <https://faucet.circle.com> (select Arc Testnet).
   Aim for **~50 USDC** so you can run the demo many times (each run uses ~10).
2. **Hedera HBAR** to the operator: get from <https://portal.hedera.com>. Aim for
   **~150 HBAR** (each accept/mint costs ~40, so this covers 3+ full runs).
3. In Vercel, confirm these are set and the site is deployed:
   - `DEMO_BYPASS_WORLDID=false` and `NEXT_PUBLIC_DEMO_BYPASS_WORLDID=false` (so World ID is
     real for judging), OR `true` if you want to skip the World App step on stage.
   - `NEXT_PUBLIC_WLD_ENV` = `production` for real users (`staging` only for the simulator).
4. Each person installs **World App** (Person A needs it to verify) and a wallet, OR uses
   Dynamic's email login (it creates an embedded wallet, no app needed).

## The run (about 3 minutes)

**Person A (Freelancer):**
1. Open cashmeifyoucan.us, click **Sign in**, connect your wallet.
2. Go to **Get funded** (`/upload`). The nav shows a **Freelancer** badge.
3. Verify with **World ID**, then upload an invoice (any PDF/photo), enter a client name
   and amount, submit.
4. On the auction page, watch the two agents bid, then **Accept** the better offer.
5. You land on the **funded** page. It shows **"Waiting on investors"** and updates live.
   Keep this screen up — it will change by itself when B and C fund.

**Person B (Public investor):**
1. Open the SAME invoice link (Person A shares the `/invest/[id]` URL, or find it under
   **Invest**). Sign in with your wallet. Nav shows an **Investor** badge.
2. Enter an amount (e.g. half), click **Buy a piece** (server-funded, you spend nothing).
3. The progress bar moves. This deposit is public and visible on Arcscan.

**Person C (Private investor):**
1. Open the same invoice, sign in.
2. Toggle **Buy privately** (Unlink), enter the rest, click **Buy a piece**.
3. This deposit is sealed: the app only ever shows the private count and total, never your
   amount. Other investors cannot see your position.

**Back to Person A:** the moment the pool hits 100%, the funded page fires
**"You've been paid $X"** (with confetti). Then trigger settlement (the demo link on the
invest page) and Person A's page shows **"Loop closed: your client has paid."**

## Keeping costs minimal across multiple runs

- **Always use "Buy a piece"** (server-funded). Avoid "Fund from my wallet" unless you
  specifically want to show a personal-wallet tx (it spends that wallet's USDC).
- Each full run costs roughly **~10 USDC + ~40 HBAR from the operator only.** With ~50 USDC
  and ~150 HBAR pre-funded, you get several clean runs.
- If "Accept" fails, the operator is out of HBAR. If funding stalls, it is out of USDC.
  Re-fund the operator from the faucets above.
- Use a **fresh invoice file** each run. Re-uploading the same file trips the duplicate
  guard (by design) and shows the "already factored" card instead of an auction.

## What judges see (the honest story)

- Three real accounts on three devices, each with its own connected wallet.
- A freelancer gated by **World ID** (one human, real backend verification).
- Two investors funding a real **Arc** pool: one **public** (visible on Arcscan), one
  **private** via **Unlink** (sealed from everyone).
- The freelancer paid on-chain only after the pool fills, with live notifications.
- All settlement, tokenization (Hedera HTS), and the audit log (Hedera HCS) verifiable on
  HashScan / Arcscan.
