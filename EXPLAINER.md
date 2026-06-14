# cashmeifyoucan, explained in plain words

No jargon. No crypto knowledge needed. Just analogies. If you can understand a
pawn shop and a group of bidders at an auction, you can understand this whole project.

---

## 1. The everyday problem

Imagine you're a freelance designer. You finish a job for a company. You send them
a bill (an "invoice") for $5,000. They say: "Great work! We'll pay you in 60 days."

But you need money **now**. Rent is due now. Groceries are due now. Not in two months.

This is the single most common money problem for the 70 million people who freelance.
You did the work, the money is *coming*, but it's stuck 60 days in the future.

---

## 2. The old solution (and why it's broken for normal people)

There's an old industry that solves this. It's called **invoice factoring**. It works
like a pawn shop for unpaid bills:

> You hand the pawn shop your $5,000 unpaid invoice. They give you, say, $4,500 cash
> today. Then they wait the 60 days and collect the full $5,000 from your client.
> Their $500 profit is the price you paid to get your money early.

This is a real, huge, $3.7 trillion industry. **But there's a catch:** the pawn shop
has to do a bunch of expensive homework on every single invoice (is this client real?
will they actually pay? is this freelancer trustworthy?). That homework costs them
money, so they only bother with **big** invoices from **big** companies. A $5,000
invoice from a solo freelancer? Not worth their time. You get turned away.

So the people who need it most can't use it.

---

## 3. Our solution, in one sentence

**We replace the slow, expensive human pawnbroker with a group of AI robots that
compete with each other to give you the best deal in about 30 seconds.**

That's the whole idea. Now let's unpack it.

---

## 4. How it actually works (the auction)

When you upload your $5,000 invoice, you don't go to *one* pawn shop. Instead, you walk
into an **auction room full of competing money-lenders** (we call them "agents"). They
all want your business, so they bid against each other:

- **Agent A (a newcomer)** says: "I'll give you $4,500 today, and I'll keep $300 as my fee."
- **Agent B (a veteran with a great track record)** says: "I'll give you $4,900 today,
  and I'll only keep $40 as my fee."

You pick Agent B. Obviously. More money, smaller fee.

The agents are AI programs. They read your invoice, check how reliable your client is,
and decide their offer in a couple of seconds. Then *you* choose the winner.

---

## 5. The clever twist (this is the part judges love)

Here's the counterintuitive bit. **The most trustworthy agent gives you the *best*
deal, not the worst.**

In normal life, the "premium" option costs *more*. Here it's the opposite. Think about
why:

> A nervous, brand-new lender has to charge extra "just in case" you or your client
> flake out. They're pricing in their own fear.
>
> A seasoned veteran who has done 500 deals successfully isn't scared. They *know* how
> to judge a good invoice. So they can afford to charge almost nothing and still win.

So as an agent becomes more trusted, it can charge **less**. Trust *squeezes* the price
down instead of pushing it up. The veteran wins your business by being cheap, and earns
a tiny amount on each deal but does tons of deals. The nervous newcomer only survives on
the riskier invoices nobody else wants.

We call this "the inversion." It's the heart of the project.

---

## 6. Where does the money come from? (the investors)

The agent isn't paying you out of its own pocket. Behind each agent is a pool of money
from **investors**, kind of like a Kickstarter for your invoice.

> Your $5,000 invoice gets posted. A bunch of regular people chip in: $1,000 here,
> $2,000 there, until it's fully funded. The moment it's full, **you get paid today.**
>
> Then 60 days later, your client pays the $5,000. That money gets split back out to all
> the investors, plus a little profit for their trouble (that's their "yield"), plus the
> agent's small fee.

Everybody wins: you got cash early, investors earned a return, the agent earned its fee.

Some investors are shy and don't want competitors to see how much they put in, or even
that they participated. So we also let them invest **privately**, like backing something
anonymously. Their money still works the same way; it's just sealed from public view.

---

## 7. What does "on a blockchain" even mean here?

You've probably heard this project is "on-chain" or "on the blockchain." Here's the only
explanation you need:

> A blockchain is a **shared notebook that nobody can erase or fake.**
>
> Normally, if a company keeps its records in its own private computer, you just have to
> *trust* that they didn't fudge the numbers. A blockchain is a notebook that thousands
> of independent computers all keep a copy of. Once something is written in it, it's
> there forever, everyone can see it, and no single person can go back and change it or
> lie about it.

That's it. It's a permanent, public, tamper-proof notebook.

We use this notebook for the things that **need** to be un-fakeable:

1. **Proving an invoice can't be sold twice.** (You shouldn't be able to take the same
   $5,000 invoice to two different auctions and get paid twice. That's fraud.)
2. **Recording which agent took which deal and why,** as a permanent receipt.
3. **Moving the actual money** (digital dollars called USDC) and splitting it to everyone
   automatically when the client pays.

We use three different specialized notebooks for this, from a network called **Hedera**,
and a money-settlement network called **Arc**. But you don't need to remember those names.

---

## 8. "You said you verify things on-chain. How can I check?"

Great question, and this is the cool part: **you don't have to take our word for any of
it.** Because the notebook is public, you can go look yourself.

The website where you read the public notebook is called **HashScan**. Think of HashScan
as the **public search engine for the notebook**, like looking up a property deed at a
public records office, except it's for digital records, and it's instant and free.

When our app says "we recorded this on-chain," it means: we wrote a line into the public
notebook, and you can find that exact line on HashScan and read it.

So what *is* the thing we write? That brings us to your specific question.

---

## 9. "What is the message payload representing?"

When we write a line into Hedera's notebook (called a "topic," basically a single page
where related notes get stacked in order), the content of that line is called the
**message payload**. It's just "the actual stuff we wrote down."

In our app there are **two different kinds** of lines we write, and they represent two
different things. Both are real and live right now on our topic, which is numbered
`0.0.9223810`. You can open it yourself here:

**https://hashscan.io/testnet/topic/0.0.9223810**

### Kind 1: The invoice fingerprint (anti-double-sell)

The first kind of line looks like this gibberish:

```
0x356f8cdd91b9328d4a69ab669d7e89f24342db0d129b815f6fba221d33d57249
```

**What it represents:** a unique "fingerprint" of one specific invoice.

Here's the analogy. Imagine you could put any document into a magic blender, and the
blender always spits out a unique 64-character code. The same document always produces
the same code. But change even *one comma* in the document, and the code comes out
completely different. And you can never run the blender backwards to get the document
back from the code.

That fingerprint is what we write down. (The technical name is a "SHA-256 hash," but
"fingerprint" is exactly what it is.)

**Why bother?** When a new invoice is uploaded, we make its fingerprint and check the
notebook: *"Have we seen this fingerprint before?"* If yes, someone is trying to sell the
same invoice twice, and we reject it. Because the fingerprint is written in the permanent
public notebook, **no one can sneak the same invoice through twice**, and anyone can audit
that we're enforcing this. The gibberish code also reveals *nothing* private about the
invoice itself; it's just a fingerprint.

So a line that's just one long code = **"this exact invoice now exists and is claimed;
it can't be claimed again."**

### Kind 2: The agent's decision (a permanent receipt)

The second kind of line is richer. Here's a **real one** from our topic (message #28),
written exactly as it appears, just formatted to be readable:

```json
{
  "type": "agent_decision",
  "invoiceHash": "0xbc2de40e2cf9aad1bfb0320584aa6f1c43091a8e8b0c45cc0c63b18f6a6f90ec",
  "agent": "Veteran Agent",
  "decision": "accepted",
  "feePercent": 0.77,
  "discountPercent": 1.98,
  "riskScore": 0.92,
  "summary": "I'm offering you a 1.98% discount because your verified client has a strong payment record with mostly on-time payments, which lowers my risk, but the 60-day wait does require a small fee to cover my capital cost."
}
```

**What it represents:** a permanent, un-editable receipt of a lending decision, the kind
of paper trail a bank is legally required to keep, except here it's public and impossible
to alter after the fact.

Let's read it line by line, in plain words:

| The line | What it means in English |
|---|---|
| `"type": "agent_decision"` | "This note is recording a lending decision." (Versus the fingerprint notes.) |
| `"invoiceHash": "0xbc2d..."` | **Which** invoice this decision was about. It points back to that invoice's fingerprint, so the two kinds of notes are linked. |
| `"agent": "Veteran Agent"` | **Who** made the offer. The veteran agent, not the newcomer. |
| `"decision": "accepted"` | The agent agreed to fund this invoice. |
| `"feePercent": 0.77` | The agent's fee is 0.77% of the invoice. (Tiny, because it's the trusted veteran, the inversion in action.) |
| `"discountPercent": 1.98` | The freelancer gives up just 1.98% to get paid 60 days early. |
| `"riskScore": 0.92` | The agent rated this deal very safe, 0.92 out of 1. (The client pays reliably.) |
| `"summary": "I'm offering you..."` | The agent's own plain-English reasoning for the offer. An AI wrote this sentence to justify its decision. |

So a line like this = **"On this date, the Veteran Agent agreed to fund invoice #bc2d...
at a 0.77% fee because it judged the deal 92% safe, and here's exactly why."** Forever.
Publicly. Un-editable.

**Why this matters:** if there's ever a dispute ("the agent ripped me off!" / "the agent
took a deal it shouldn't have!"), there is a permanent public receipt of precisely what
was decided, by whom, on what terms, and with what reasoning. Nobody can quietly rewrite
history. That's the entire point of putting it in the un-erasable notebook instead of our
own private database.

---

## 10. The other stuff on HashScan you might see

When you poke around HashScan, you'll also run into a few other words. Quick translations:

- **Topic** = one page of the notebook where related notes stack up in order. Ours is
  `0.0.9223810`. Each note gets a **sequence number** (#1, #2, #3...) so the order is
  permanent and provable.
- **Token** = a digital certificate of ownership. When an agent funds your invoice, we
  create a token that represents "shares" of that invoice, so investors can each own a
  piece. (On Hedera these are made with a tool called HTS.)
- **Consensus timestamp** = the official, network-agreed moment the note was written. Not
  "what our server's clock said," but what thousands of independent computers *agreed*
  the time was. Un-fudgeable.
- **Transaction** = any single action recorded on the network (writing a note, creating a
  token, moving money). Each one has its own page on HashScan you can open and inspect.

---

## 11. The one-paragraph version (if you remember nothing else)

> Freelancers wait 60 days to get paid. We let AI lenders compete in a 30-second auction
> to advance them cash today, funded by investors who earn a return when the client
> eventually pays. The surprising twist is that the *most trustworthy* lender gives the
> *best* deal, because trust removes the need to charge a fear premium. And every
> important step (proving an invoice is unique, recording each lending decision, moving
> the actual money) is written into a public, tamper-proof notebook that anyone can audit
> on HashScan, so you never have to just trust us.

That's cashmeifyoucan.
