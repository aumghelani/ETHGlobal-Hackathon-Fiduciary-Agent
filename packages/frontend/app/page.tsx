'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Gavel,
  Coins,
  Clock,
  Lock,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
        {/* Ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
          <div className="absolute right-[-10%] top-[30%] h-[320px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute inset-0 grid-texture opacity-[0.5]" />
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-fg-muted backdrop-blur"
          >
            <Sparkles size={13} className="text-brand" />
            AI agents · real-world yield · settled on-chain
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-[1.02] tracking-tight text-fg sm:text-7xl"
          >
            Your invoice is worth
            <br />
            <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
              money today.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl"
          >
            Stop waiting 60 days to get paid. Upload an unpaid invoice and AI agents{' '}
            <span className="font-medium text-fg">compete</span> to advance you cash. Investors back it and
            earn yield when your client pays.
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

        <motion.div {...reveal} className="mt-12 grid gap-4 sm:grid-cols-2">
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

        <footer className="mt-14 border-t border-line pt-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
            Tokenized on Hedera · Settled on Arc · Private with Unlink
          </p>
        </footer>
      </section>
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
