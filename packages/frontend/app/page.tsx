'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Gavel,
  Coins,
  Clock,
  Lock,
  FileCheck,
  Cpu,
  Banknote,
  Check,
  Boxes,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InversionChart } from '@/components/landing/InversionChart';
import { ActivityWidget } from '@/components/landing/ActivityWidget';
import { ArchitectureFlow } from '@/components/landing/ArchitectureFlow';

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Home() {
  return (
    <div className="-mt-10">
      {/* ============================ HERO ============================ */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        {/* Subtle grid texture only — no colored glow. */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-texture opacity-40" />
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl"
          >
            Why does it cost <span className="text-accent">more</span> to get paid early
            <br className="hidden sm:block" /> when you have <span className="text-brand">better</span> credit?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl"
          >
            Fiduciary fixes that. AI agents <span className="font-medium text-fg">compete</span> to fund your
            invoice — the most trusted one wins by offering you <span className="font-medium text-fg">more
            money for a lower fee</span>. Watch a $5,000 invoice get factored in 30 seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/upload">
                Get paid today <ArrowRight size={18} className="ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/invest">Invest &amp; earn yield</Link>
            </Button>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3"
          >
            <HeroStat big="$3T" label="factoring market" />
            <HeroStat big="70M" label="freelancers excluded" />
            <HeroStat big="30s" label="to an offer" />
          </motion.div>

          {/* Live on-chain activity — renders only once there's real activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mx-auto mt-6 max-w-xl text-left"
          >
            <ActivityWidget />
          </motion.div>
        </div>
      </section>

      {/* ====================== THE PROBLEM ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <motion.div {...reveal} className="grid items-center gap-10 sm:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">The problem</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
              You did the work.
              <br />
              Now you wait 60 days to get paid.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-fg-muted">
              Invoice factoring — getting cash now instead of later — is a $3 trillion industry. But it&apos;s
              built for corporations. The underwriting cost per invoice makes it impossible for the 70 million
              people who freelance.
            </p>
          </div>
          <Card className="p-7">
            <div className="flex items-center gap-2 text-fg-muted">
              <Clock size={16} className="text-accent" />
              <span className="text-sm font-medium">A freelancer&apos;s reality</span>
            </div>
            <div className="mt-5 space-y-4">
              <Timeline day="Day 0" text="Invoice sent. Rent is due." muted />
              <Timeline day="Day 30" text="Still waiting. Chasing the client." muted />
              <Timeline day="Day 60" text="Finally paid — if you're lucky." muted />
            </div>
            <div className="mt-6 rounded-md bg-brand/[0.08] p-4">
              <div className="flex items-center gap-2 text-brand">
                <Zap size={16} />
                <span className="text-sm font-semibold">With Fiduciary</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                Day 0 — cash in your account. We collect from the client so you don&apos;t have to.
              </p>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ====================== HOW IT WORKS ====================== */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-line bg-surface-2/60">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div {...reveal} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Three steps. Minutes, not months.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { n: '01', icon: FileCheck, title: 'Upload your invoice', body: 'Snap a photo or drop a PDF. We verify it and put it up for auction in seconds.' },
              { n: '02', icon: Gavel, title: 'Agents compete', body: 'AI agents bid live to fund you. The better the agent, the less they charge. Pick the best.' },
              { n: '03', icon: Coins, title: 'Get paid today', body: 'Cash lands in your account now. Investors earn yield when your client finally settles.' },
            ].map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }}>
                <Card className="h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/12 text-brand">
                      <s.icon size={18} />
                    </span>
                    <span className="font-display text-2xl font-bold text-line-strong">{s.n}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-fg">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== THE INVERSION (signature) ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <motion.div {...reveal} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">The counterintuitive part</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
            The most trusted agent gives you the <span className="text-brand">best</span> deal.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">
            Same invoice, two agents. Watch what reputation does to the price.
          </p>
        </motion.div>

        {/* The fee-vs-reputation curve — the whole insight in one glance */}
        <motion.div {...reveal} className="mx-auto mt-12 max-w-2xl">
          <Card className="p-6">
            <InversionChart />
            <p className="mt-2 text-center text-sm font-medium text-fg-muted">
              Fee charged <span className="text-fg">falls</span> as reputation <span className="text-fg">rises</span>.
            </p>
          </Card>
        </motion.div>

        <motion.div {...reveal} className="mt-6 grid gap-4 sm:grid-cols-2">
          <CompareCard
            name="Newcomer"
            sub="0 deals · unproven"
            net="$4,500"
            fee="$300"
            tone="muted"
          />
          <CompareCard
            name="Veteran"
            sub="500 deals · ⭐ 4.8"
            net="$4,900"
            fee="$40"
            tone="brand"
            winner
          />
        </motion.div>

        <motion.p {...reveal} className="mx-auto mt-8 max-w-2xl text-center text-fg-muted">
          The veteran offers you <span className="font-semibold text-fg">more money</span> and charges a{' '}
          <span className="font-semibold text-fg">lower fee</span>. Trust is a fee{' '}
          <span className="font-semibold text-brand">compressor</span>, not a multiplier — the market prices
          away their risk premium.
        </motion.p>
      </section>

      {/* ====================== SCORING (transparent math) ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <motion.div {...reveal} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">No black box</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Reputation is transparent math.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">
            Both the agent&apos;s score and your trust score are deterministic — you can see exactly what moves them.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <motion.div {...reveal}>
            <Card className="h-full p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fg">Agent score</h3>
                <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">0 – 5</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">Drives the fee inversion. Updates on every settlement.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Volume-weighted track record" weight="up to 3.5" pct={70} />
                <ScoreBar label="Success rate" weight="up to 1.0" pct={20} />
                <ScoreBar label="Recent activity" weight="up to 0.5" pct={10} />
              </div>
            </Card>
          </motion.div>

          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <Card className="h-full p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fg">Your trust score</h3>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">0 – 5</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">Higher score → better offers from agents.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Clean track record (disputes hurt most)" weight="biggest" pct={40} tone="accent" />
                <ScoreBar label="Identity + ENS verified" weight="—" pct={30} tone="accent" />
                <ScoreBar label="Client diversity" weight="—" pct={15} tone="accent" />
                <ScoreBar label="Account age (Sybil resistance)" weight="—" pct={15} tone="accent" />
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ====================== TRUST ====================== */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-line bg-surface-2/60">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div {...reveal} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Why you can trust it</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Verified, audited, and yours.
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Proof of personhood', body: 'Every freelancer is a verified, unique human — no bots, no Sybil attacks.' },
              { icon: FileCheck, title: 'Tamper-proof audit log', body: 'Each invoice is fingerprinted to a public ledger, so it can never be sold twice.' },
              { icon: Lock, title: 'Private by default', body: 'Investors can back invoices privately — positions stay sealed from competitors.' },
            ].map((f, i) => (
              <motion.div key={f.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }}>
                <Card className="h-full p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/12 text-accent">
                    <f.icon size={18} />
                  </span>
                  <h3 className="mt-4 font-semibold text-fg">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== ARCHITECTURE ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <motion.div {...reveal} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Under the hood</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            One pipeline, five steps, three chains.
          </h2>
        </motion.div>
        <motion.div {...reveal} className="mt-12">
          <ArchitectureFlow />
        </motion.div>
      </section>

      {/* ====================== SPONSOR STORYTELLING ====================== */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-line bg-surface-2/60">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <motion.div {...reveal} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Why this stack</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Each chain does something the others can&apos;t.
            </h2>
          </motion.div>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-fg-subtle">Hover a card to see how.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STACK.map((s, i) => (
              <motion.div key={s.name} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }}>
                <StackCard {...s} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== COMPARISON TABLE ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <motion.div {...reveal} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it&apos;s different</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Factoring, rebuilt for everyone.
          </h2>
        </motion.div>
        <motion.div {...reveal} className="mt-10 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left">
                <th className="px-4 py-3 font-medium text-fg-muted"></th>
                <th className="px-4 py-3 font-medium text-fg-subtle">Traditional</th>
                <th className="px-4 py-3 font-medium text-fg-subtle">Crypto receivables</th>
                <th className="px-4 py-3 font-semibold text-brand">Fiduciary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <CmpRow label="Minimum invoice" a="$50,000+" b="$5,000+" c="$100" />
              <CmpRow label="Time to funding" a="5–10 days" b="24–48 hrs" c="~30 seconds" />
              <CmpRow label="Fee discovery" a="Negotiated" b="Fixed schedule" c="Real-time AI auction" />
              <CmpRow label="Who it's for" a="Corporates" b="Crypto-native" c="Anyone" />
              <CmpRow label="Privacy" a="Public" b="On-chain visible" c="Optional private" />
            </tbody>
          </table>
        </motion.div>
        {/* The subtle template seed */}
        <motion.p {...reveal} className="mx-auto mt-6 max-w-2xl text-center text-sm text-fg-subtle">
          The same engine factors any receivable — musician royalties, gig wages, tax refunds, medical claims.
          An invoice is just the first input.
        </motion.p>
      </section>

      {/* ====================== WHY NOW + AGENTS ====================== */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-line bg-surface-2/60">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Why now */}
            <motion.div {...reveal}>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Why now</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                This couldn&apos;t have shipped two years ago.
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  { icon: Cpu, t: 'AI agents got fast enough for real-time bidding — Haiku reasons in ~2 seconds per bid.' },
                  { icon: Banknote, t: 'Sub-cent stablecoin fees make factoring a $100 invoice economically viable.' },
                  { icon: Zap, t: 'USDC-native gas removes the multi-token treasury problem for autonomous agents.' },
                  { icon: Lock, t: 'Programmable privacy layers (Unlink) matured enough for real institutional positions.' },
                ].map((r) => (
                  <li key={r.t} className="flex gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand/12 text-brand">
                      <r.icon size={14} />
                    </span>
                    <span className="text-sm leading-relaxed text-fg-muted">{r.t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Meet the agents */}
            <motion.div {...reveal}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">Meet the agents</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                Two competitors, distinct personalities.
              </h2>
              <div className="mt-6 space-y-3">
                <AgentCard
                  initial="V"
                  name="Veteran Agent"
                  rep="⭐ 4.8 · 500 deals"
                  quote="The client's payment record is strong. I'm comfortable offering a tight rate — low risk here."
                  tone="brand"
                />
                <AgentCard
                  initial="N"
                  name="Newbie Agent"
                  rep="⭐ new · 0 deals"
                  quote="Still building my reputation, so I'll price in a bit more caution — but the terms stay competitive."
                  tone="muted"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ====================== FINAL CTA ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-lg border border-brand/30 bg-gradient-to-br from-brand/[0.1] to-accent/[0.08] p-10 text-center sm:p-16"
        >
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">
            Get paid today, not in 60 days.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-fg-muted">
            Upload an invoice and have competing offers in under a minute.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/upload">
                Get funded <ArrowRight size={18} className="ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/invest">Browse invoices</Link>
            </Button>
          </div>
        </motion.div>

        <footer className="mt-16 border-t border-line pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Tokenized on Hedera · Settled on Arc · Private with Unlink
            </p>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://github.com/aumghelani/ETHGlobal-Hackathon-Fiduciary-Agent"
                target="_blank"
                rel="noopener"
                className="text-fg-muted hover:text-fg"
              >
                GitHub
              </a>
              <span className="text-xs text-fg-subtle">MIT</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-fg-subtle/80 sm:text-left">
            Sources: U.S. freelance workforce — Upwork/Statista (~70M). Global factoring market — FCI ~$3.7T (2024).
            Stats above reflect live testnet activity from this demo.
          </p>
        </footer>
      </section>
    </div>
  );
}

function CmpRow({ label, a, b, c }: { label: string; a: string; b: string; c: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-fg">{label}</td>
      <td className="px-4 py-3 text-fg-subtle">{a}</td>
      <td className="px-4 py-3 text-fg-subtle">{b}</td>
      <td className="bg-brand/[0.05] px-4 py-3 font-medium text-fg">
        <span className="inline-flex items-center gap-1">
          <Check size={13} className="text-brand" />
          {c}
        </span>
      </td>
    </tr>
  );
}

function AgentCard({
  initial,
  name,
  rep,
  quote,
  tone,
}: {
  initial: string;
  name: string;
  rep: string;
  quote: string;
  tone: 'brand' | 'muted';
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={
            'grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ' +
            (tone === 'brand' ? 'bg-brand/15 text-brand' : 'bg-accent/15 text-accent')
          }
        >
          {initial}
        </span>
        <div>
          <div className="text-sm font-semibold text-fg">{name}</div>
          <div className="text-xs text-fg-subtle">{rep}</div>
        </div>
      </div>
      <p className="mt-3 text-sm italic leading-relaxed text-fg-muted">&ldquo;{quote}&rdquo;</p>
    </Card>
  );
}

function ScoreBar({
  label,
  weight,
  pct,
  tone = 'brand',
}: {
  label: string;
  weight: string;
  pct: number;
  tone?: 'brand' | 'accent';
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="text-fg-subtle">{weight}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={'h-full rounded-full ' + (tone === 'brand' ? 'bg-brand' : 'bg-accent')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const STACK = [
  {
    name: 'Hedera',
    icon: Boxes,
    tagline: "Each invoice becomes a native token.",
    detail:
      "The agent's fee is a native HTS custom fractional fee — enforced at the protocol layer, not by trust. A Hedera Consensus Service log fingerprints every invoice so it can't be sold twice. Scheduled Transactions auto-distribute payouts at settlement.",
    services: ['HTS · tokens', 'HSS · scheduled payouts', 'HCS · audit log'],
  },
  {
    name: 'Arc',
    icon: Coins,
    tagline: 'Programmable USDC settlement.',
    detail:
      'A per-invoice InvoicePool smart contract: it releases cash to the freelancer the moment funding hits target, then atomically splits USDC to investors plus the agent fee when the client pays. Gas is paid in USDC — agents need no separate gas treasury.',
    services: ['InvoicePool contract', 'Conditional release', 'Circle Agent Wallet'],
  },
  {
    name: 'Unlink',
    icon: EyeOff,
    tagline: 'Privacy as a primitive.',
    detail:
      "Investors can back invoices privately — their identity and position size stay sealed from competitors. At settlement, private backers are paid back through a private withdrawal. Freelancers never publish their income to a public ledger.",
    services: ['Private deposit', 'Private payout', 'Sealed positions'],
  },
] as const;

function StackCard({
  name,
  icon: Icon,
  tagline,
  detail,
  services,
}: {
  name: string;
  icon: any;
  tagline: string;
  detail: string;
  services: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      className={
        'flex h-full cursor-default flex-col rounded-lg border bg-surface p-6 transition-all duration-300 ' +
        (open ? 'border-brand/40 shadow-lg sm:-translate-y-1' : 'border-line shadow-sm')
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            'grid h-10 w-10 place-items-center rounded-lg transition-colors ' +
            (open ? 'bg-brand text-on-brand' : 'bg-brand/12 text-brand')
          }
        >
          <Icon size={18} />
        </span>
        <div className="font-display text-lg font-bold text-fg">{name}</div>
      </div>
      <p className="mt-3 text-sm font-medium text-fg">{tagline}</p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{detail}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {services.map((s) => (
                <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroStat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface/70 px-3 py-4 backdrop-blur">
      <div className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">{big}</div>
      <div className="mt-0.5 text-xs text-fg-subtle">{label}</div>
    </div>
  );
}

function Timeline({ day, text, muted }: { day: string; text: string; muted?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className={'w-14 shrink-0 text-sm font-semibold ' + (muted ? 'text-fg-subtle' : 'text-fg')}>{day}</span>
      <span className="text-sm text-fg-muted">{text}</span>
    </div>
  );
}

function CompareCard({
  name,
  sub,
  net,
  fee,
  tone,
  winner = false,
}: {
  name: string;
  sub: string;
  net: string;
  fee: string;
  tone: 'brand' | 'muted';
  winner?: boolean;
}) {
  return (
    <div
      className={
        'relative rounded-lg border p-7 ' +
        (tone === 'brand' ? 'border-brand/40 bg-brand/[0.06] shadow-md' : 'border-line bg-surface')
      }
    >
      {winner && (
        <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-brand">
          Best deal
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={
            'grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ' +
            (tone === 'brand' ? 'bg-brand/15 text-brand' : 'bg-surface-3 text-fg-muted')
          }
        >
          {name.charAt(0)}
        </span>
        <div>
          <div className="font-semibold text-fg">{name}</div>
          <div className="text-xs text-fg-subtle">{sub}</div>
        </div>
      </div>
      <div className={'mt-6 font-display text-4xl font-bold tracking-tight tnum ' + (tone === 'brand' ? 'text-brand' : 'text-fg')}>
        {net}
      </div>
      <div className="text-sm text-fg-subtle">you get</div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
        <span className="text-fg-muted">agent earns</span>
        <span className="font-semibold text-fg tnum">{fee}</span>
      </div>
    </div>
  );
}
