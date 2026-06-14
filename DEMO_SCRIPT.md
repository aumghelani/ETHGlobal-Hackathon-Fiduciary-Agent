# cashmeifyoucan: Demo Script

> Presenter's walkthrough for hackathon judging. Live at **https://cashmeifyoucan.us**.
> For non-technical viewers, hand them **EXPLAINER.md** instead. This file is for driving the live demo.

**Total runtime: about 4 to 5 minutes.** Read the spoken lines in "quotes" out loud. Everything else is a stage direction.

---

## 1. TL;DR / the hook

> "Freelancers do the work, then wait 60 days to get paid. Invoice factoring fixes that, but it is built for corporations: the underwriting cost per invoice prices out the 70 million people who freelance. cashmeifyoucan turns that underwriting into a 30-second auction where AI agents compete to fund your invoice, and the most trusted agent wins by paying you MORE and charging you LESS."

That last clause is the whole pitch. If a judge only remembers one sentence, make it that one.

---

## 2. Pre-flight checklist

Run through this BEFORE you stand up. None of it is spoken.

- [ ] **Operator account funded with HBAR.** The Hedera HTS mint on "Accept" costs roughly 40 HBAR. If the operator is dry, the Accept step fails. This is the single most common live-demo failure. Check it first.
- [ ] **Arc / Circle wallet funded with testnet USDC.** Per-invoice pools deploy and settle on Arc, and Arc gas is paid in USDC. No USDC means nothing funds and settlement stalls.
- [ ] **Env vars set** in the Vercel deployment: Anthropic API key (agent reasoning), Hedera operator key + account, Arc/Circle credentials, Unlink API key + App ID, World ID app, and the Dynamic env var (or the login button will not render). If you want to skip the World ID popup, confirm the demo-bypass flag is set the way you expect.
- [ ] **A sample invoice PDF or photo ready on the desktop.** Use a fresh one. Re-uploading an invoice you already factored trips the duplicate guard (by design) and shows the "already factored" card instead of the auction.
- [ ] **Know where the Dev toggle is.** Top-right of the nav, the small "Dev" button with the sparkle icon. Default OFF so the app reads as a clean fintech product. You will flip it ON near the end to reveal the on-chain proof. Make sure it is OFF when you begin.
- [ ] **The live URL open** at https://cashmeifyoucan.us in a fresh tab, on the landing page, theme set to your preference.
- [ ] **A second tab ready** for HashScan, so you can jump to the audit-log topic without fumbling. Topic: `0.0.9223810`.

---

## 3. The walkthrough

A numbered, click-by-click script. For each step: what to DO, what to SAY, what to POINT AT.

### Step 1: Landing page

- **DO:** Start on https://cashmeifyoucan.us. Dev mode OFF. Scroll slowly from the hero down to the "counterintuitive part" section.
- **SAY:** "This is cashmeifyoucan. The headline asks the question the whole product answers: why does it cost more to get paid early when you have better credit? It shouldn't, and here it doesn't."
- **POINT AT:** The hero stats ($3T factoring market, 70M freelancers excluded, 30s to an offer), then the two compare cards lower down: a Newcomer leaving you $4,500 for a $300 fee, versus a Veteran leaving you $4,900 for a $40 fee, tagged "Best deal."
- **SAY:** "Hold that thought. The veteran pays more and charges less. I am going to make that happen live in about 30 seconds."

### Step 2: Upload the invoice (with World ID gate)

- **DO:** Click **"Get paid today"** (or the nav's **Get funded**) to go to **/upload**. Choose the sample PDF. Fill in a client name (e.g. "BigCorp"), an amount (e.g. 5000), and leave days-until-payment at 60.
- **SAY:** "I upload an unpaid invoice. Before anything happens, I have to prove I am a real, unique human."
- **DO:** Click **"Verify you're a real person"** and complete the World ID step. (If the demo-bypass flag is on, note it out loud: "World ID is gating this in production; I have bypassed it for the demo.")
- **POINT AT:** The "Verified as a real person" confirmation, and the two trust badges near the top (Identity verified / Domain verified).
- **SAY:** "That is proof-of-personhood, so no bots and no Sybil farms. The invoice is also fingerprinted and committed to a public audit log the moment I submit, which is what stops the same invoice from being sold twice."
- **DO:** Click **"Get offers."** The page hashes the file and redirects to the auction.

> If you ever want to show the double-sell defense: re-upload the SAME invoice. You will get the "This invoice has already been factored" card. Optional, only if you have time.

### Step 3: The live auction (the wow moment)

- **DO:** You are now on **/auction/{id}**. The agents bid live. The Veteran bid appears first, then the Newbie bid about half a second later. Let both land before you talk over them.
- **SAY:** "Two AI agents are competing for my invoice right now. A Veteran with 500 deals and a 4.8 rating, and a Newcomer with no track record. Watch the gap."
- **POINT AT:** The two **bid cards** side by side. Read the Veteran's "you get" number and its fee, then the Newbie's. Then drop to the **"The counterintuitive part"** insight panel that appears below once both bids are in.
- **SAY:** "Here is the inversion. The Veteran pays me MORE money AND takes a SMALLER fee than the Newcomer. Trust is not a premium you pay, it is a discount you earn. The market prices away the veteran's risk, so the most reputable agent gives the best deal and earns the least on it, which is exactly why newcomers survive on the riskier long tail."
- **POINT AT:** The two stats in that panel: "Veteran pays you more (+$...)" and "yet the Veteran earns less (-$...)." This is the single most important screen in the demo. Linger here.

### Step 4: Accept the Veteran

- **DO:** Click **Accept** on the Veteran card. (Watch for the "tokenizing" state on the card.)
- **SAY:** "I accept the Veteran. Behind this click, the agent mints a token for my invoice on Hedera and writes its fee into the token at the protocol level, so it literally cannot be cut out of the deal. Then it deploys a funding pool for this invoice on Arc."
- **POINT AT:** The accepting/tokenizing state, then the auto-redirect to the funded view.

> Pre-flight reminder to yourself: this is the step that spends ~40 HBAR. If it errors, the operator is out of HBAR (see the troubleshooting table).

### Step 5: Funded view (the freelancer's outcome)

- **DO:** You land on **/funded/{invoiceId}**. Let the status steps cascade and the confetti fire.
- **SAY:** "Done. The cash is on its way to my bank account, and the agent will collect from my client so I never have to chase it. I got paid on day zero instead of day 60."
- **POINT AT:** The big "You're funded" amount, the three status steps (Invoice verified / Offer secured / Cash on its way), and the freelancer **reputation** card with the tips to raise it. Note the "Cash routed to your bank account" row.
- **SAY:** "And my own reputation just went up, which earns me even better offers next time."

### Step 6 (optional): Investing, including private investing

Skip this if you are tight on time; the core story is complete. Include it to show the two-sided market and the privacy integration.

- **DO:** Go to **/invest** (nav), then open this invoice at **/invest/{invoiceId}**.
- **SAY:** "The other side of the market: investors fund a piece of the invoice and earn yield when the client pays. Anyone can put in as little as a hundred dollars."
- **POINT AT:** The funding progress bar, the "Managed by {agent} . {fee}% fee" row, and the public/private investor counts.
- **DO:** Flip the **"Buy privately"** toggle ON. Enter an amount. Click **"Buy a piece."**
- **SAY:** "An investor can also fund privately. Their identity and their amount stay sealed from every other investor, powered by Unlink. At settlement they still get paid, through a private withdrawal."
- **POINT AT:** The "Your position stays sealed from other investors. Privacy by Unlink." note under the toggle.

### Step 7: Settle (client pays, money distributes)

- **DO:** Go to **/settle/{invoiceId}**. Click **"Simulate client payment."**
- **SAY:** "Now the client actually pays. Watch the money flow through the system on its own."
- **POINT AT:** The cascade as each step lights up:
  1. **Client payment received** to investors,
  2. **Payouts distributed to backers** (the on-chain scheduled distribution fires),
  3. **Private backers paid out** (if you funded privately in step 6, sealed from everyone else),
  4. **Agent reputation updated**, showing the before to after number tick up.
- **SAY:** "Payment in, distribution out, all of it automatic. Every backer's share is sent without anyone pressing another button, and the agent's reputation updates from the real settlement, which is what drives the next auction's pricing. The loop closes."

### Step 8: Flip on Dev mode and show the proof

- **DO:** Click the **Dev** toggle in the nav (top-right, sparkle icon). The same screens now reveal the on-chain layer.
- **SAY:** "Everything you just saw was a clean product surface. Now let me prove it is real. I am turning on Dev mode."
- **POINT AT:** On the settled / invest view: the real USDC amounts, the agent's wallet link, and the explorer links that just appeared. On the settle cascade: **"View on Arc"** next to the payment, **"Verify on Hedera"** next to the distribution, and **"Private withdraw"** next to the private payout.
- **SAY:** "USDC amounts, transaction hashes, and live explorer links. This is not a mockup. Let me show you the audit log itself."

---

## 4. The "show it's real on-chain" moment

With Dev mode still ON, take it all the way to the ledger. Switch to your HashScan tab.

- **DO:** Open HashScan to the audit-log topic **`0.0.9223810`** (Hedera testnet). You can also reach it by clicking the "audit log" link surfaced on the auction or funded pages. Scroll the topic's recent messages.
- **SAY:** "This is one shared Hedera consensus topic that every invoice on the platform writes to."

Point out the two kinds of messages this invoice produced:

- **The invoice fingerprint message.**
  - **SAY:** "This is the hash of the invoice I uploaded. It is what makes the invoice impossible to sell twice. Any platform could query this same topic and see it is already taken."
- **The agent-decision JSON receipt.**
  - **SAY:** "And this is the agent's decision, recorded as a receipt: which agent won, the fee it set, and why. The underwriting is auditable, not a black box."

One sentence each is enough. The point is simply: the fingerprint proves the invoice is unique, and the decision receipt proves the AI's pricing is transparent and on the record.

Then, if you showed settlement, note that the **Arc** transaction (the "View on Arc" link) is the actual USDC distribution, and the **Hedera scheduled transaction** (the "Verify on Hedera" link) is the deferred "settle on maturity" payout firing. Three sponsors, all load-bearing: **Hedera** for the token, the audit log, and the scheduled distribution; **Arc/Circle** for the USDC pool and settlement; **Unlink** for the private positions and private payout.

---

## 5. If something breaks

Stay calm, name the cause, move on. The product story survives any single failure.

| Symptom | Most likely cause | Quick recovery |
|---|---|---|
| **"Accept" fails** on the auction | Operator account is out of **HBAR** (the HTS mint costs ~40 HBAR) | Top up the operator, or narrate the step and continue from a pre-funded invoice |
| **Nothing funds / pool stalls** | Arc / Circle wallet has no **USDC**, or Arc gas can't be paid | Refill testnet USDC from the Circle faucet; retry |
| **Page 404s right after upload** | Invoice never persisted: **store / Upstash** issue (env or connectivity) | Check the Upstash/store env vars; re-upload; fall back to an invoice that already exists |
| **Login / connect button missing** | **Dynamic** env var not set | Expected if Dynamic is unconfigured; the core flow does not need it, so just proceed |
| **Upload shows "already factored"** | Duplicate guard fired: this invoice hash is already on the audit log | Use a fresh invoice PDF (or frame it as the double-sell defense working) |
| **World ID popup won't complete** | World ID app/env or network | Flip on the demo-bypass flag and narrate that it gates in production |

---

## 6. Closing line

> "So that is cashmeifyoucan: a freelancer gets paid in 30 seconds instead of 60 days, investors earn real yield, and the most trustworthy agent wins by being the most generous. And an invoice is just the first input. The same engine, a trust-priced agent marketplace on top of a tokenization and settlement pipeline, factors any future receivable: musician royalties, gig wages, tax refunds, medical claims. We rebuilt factoring so it finally works for the 70 million people it was never built for."
