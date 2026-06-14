'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Gavel,
  Coins,
  Lock,
  FileCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InversionChart } from '@/components/landing/InversionChart';
import { ActivityWidget } from '@/components/landing/ActivityWidget';
import { SponsorStrip } from '@/components/landing/SponsorStrip';

// One quiet fade-up, reused. Kept short and subtle so the page reads as a product,
// not a slide deck.
const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Home() {
  return (
    <div>
      {/* ============================ HERO ============================ */}
      <section className="mx-auto max-w-4xl px-5 pb-12 pt-10 text-center sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="mx-auto max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">
            Why does it cost <span className="text-accent">more</span> to get paid early
            when you have <span className="text-brand">better</span> credit?
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
            cashmeifyoucan fixes that. AI agents compete to fund your invoice, and the most
            trusted one wins by offering you more money for a lower fee. A $5,000 invoice gets
            factored in about 30 seconds.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/upload">
                Get paid today <ArrowRight size={18} className="ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/invest">Invest and earn yield</Link>
            </Button>
          </div>

          <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-3">
            <HeroStat big="$3T" label="factoring market" />
            <HeroStat big="70M" label="freelancers excluded" />
            <HeroStat big="30s" label="to an offer" />
          </div>
        </motion.div>

        {/* Live on-chain activity, only once there's real activity */}
        <div className="mx-auto mt-5 max-w-xl text-left">
          <ActivityWidget />
        </div>
      </section>

      {/* ====================== BUILT WITH (sponsors) ====================== */}
      <section className="mx-auto max-w-5xl px-5 pb-10">
        <SponsorStrip />
      </section>

      {/* ====================== THE PROBLEM ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade} className="grid items-start gap-8 sm:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">The problem</p>
            <h2 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">
              You did the work, then you wait 60 days to get paid.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-fg-muted">
              Invoice factoring, getting cash now instead of later, is a $3 trillion industry. But
              it&apos;s built for corporations. The underwriting cost per invoice makes it impossible
              for the 70 million people who freelance.
            </p>
          </div>
          <Card className="p-6">
            <div className="space-y-3">
              <Timeline day="Day 0" text="Invoice sent. Rent is due." />
              <Timeline day="Day 30" text="Still waiting. Chasing the client." />
              <Timeline day="Day 60" text="Finally paid, if you're lucky." />
            </div>
            <div className="mt-5 rounded-md bg-brand/[0.08] p-4">
              <div className="flex items-center gap-2 text-brand">
                <Zap size={15} />
                <span className="text-sm font-semibold">With cashmeifyoucan</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">
                Day 0, cash in your account. We collect from the client so you don&apos;t have to.
              </p>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* ====================== HOW IT WORKS ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade}>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it works</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Three steps. Minutes, not months.
          </h2>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { n: '01', icon: FileCheck, title: 'Upload your invoice', body: 'Drop a PDF or snap a photo. We verify it and put it up for auction in seconds.' },
            { n: '02', icon: Gavel, title: 'Agents compete', body: 'AI agents bid live to fund you. The better the agent, the less they charge.' },
            { n: '03', icon: Coins, title: 'Get paid today', body: 'Cash lands in your account now. Investors earn yield when the client settles.' },
          ].map((s) => (
            <motion.div key={s.n} {...fade}>
              <Card className="h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/12 text-brand">
                    <s.icon size={17} />
                  </span>
                  <span className="font-display text-xl font-bold text-line-strong">{s.n}</span>
                </div>
                <h3 className="mt-3 font-semibold text-fg">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====================== THE INVERSION (core insight) ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade}>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">The counterintuitive part</p>
          <h2 className="mt-2 max-w-2xl font-display text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">
            The most trusted agent gives you the <span className="text-brand">best</span> deal.
          </h2>
          <p className="mt-2 max-w-xl text-base text-fg-muted">
            Same invoice, two agents. Reputation, not risk, sets the price.
          </p>
        </motion.div>

        <div className="mt-8 grid items-center gap-4 lg:grid-cols-[1.1fr_1fr]">
          <motion.div {...fade}>
            <Card className="p-5">
              <InversionChart />
              <p className="mt-2 text-center text-sm font-medium text-fg-muted">
                Fee charged <span className="text-fg">falls</span> as reputation{' '}
                <span className="text-fg">rises</span>.
              </p>
            </Card>
          </motion.div>

          <motion.div {...fade} className="grid gap-4">
            <CompareCard name="Newcomer" sub="0 deals, unproven" net="$4,500" fee="$300" tone="muted" />
            <CompareCard name="Veteran" sub="500 deals, 4.8 rating" net="$4,900" fee="$40" tone="brand" winner />
          </motion.div>
        </div>

        <motion.p {...fade} className="mx-auto mt-6 max-w-2xl text-center text-sm text-fg-muted">
          The veteran offers you <span className="font-semibold text-fg">more money</span> and charges a{' '}
          <span className="font-semibold text-fg">lower fee</span>. Trust compresses the price instead of
          inflating it, because the market prices away the risk premium.
        </motion.p>
      </section>

      {/* ====================== SCORING (transparent math) ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade}>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">No black box</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Reputation is transparent math.
          </h2>
          <p className="mt-2 max-w-xl text-base text-fg-muted">
            Both the agent&apos;s score and your trust score are deterministic. You can see exactly what
            moves them.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <motion.div {...fade}>
            <Card className="h-full p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fg">Agent score</h3>
                <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">0 to 5</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">Drives the fee inversion. Updates on every settlement.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Volume-weighted track record" weight="up to 3.5" pct={70} />
                <ScoreBar label="Success rate" weight="up to 1.0" pct={20} />
                <ScoreBar label="Recent activity" weight="up to 0.5" pct={10} />
              </div>
            </Card>
          </motion.div>

          <motion.div {...fade}>
            <Card className="h-full p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-fg">Your trust score</h3>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">0 to 5</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">Higher score means better offers from agents.</p>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Clean track record (disputes hurt most)" weight="biggest" pct={40} tone="accent" />
                <ScoreBar label="Identity and ENS verified" weight="medium" pct={30} tone="accent" />
                <ScoreBar label="Client diversity" weight="medium" pct={15} tone="accent" />
                <ScoreBar label="Account age (Sybil resistance)" weight="medium" pct={15} tone="accent" />
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ====================== TRUST ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade}>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Why you can trust it</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Verified, audited, and yours.
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Proof of personhood', body: 'Every freelancer is a verified, unique human. No bots, no Sybil attacks.' },
            { icon: FileCheck, title: 'Tamper-proof audit log', body: 'Each invoice is fingerprinted to a public ledger, so it can never be sold twice.' },
            { icon: Lock, title: 'Private by default', body: 'Investors can back invoices privately. Positions stay sealed from competitors.' },
          ].map((f) => (
            <motion.div key={f.title} {...fade}>
              <Card className="h-full p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/12 text-accent">
                  <f.icon size={17} />
                </span>
                <h3 className="mt-3 font-semibold text-fg">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====================== COMPARISON TABLE ====================== */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 py-14">
        <motion.div {...fade}>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">How it&apos;s different</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Factoring, rebuilt for everyone.
          </h2>
        </motion.div>
        <motion.div {...fade} className="mt-8 overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left">
                <th className="px-4 py-3 font-medium text-fg-muted"></th>
                <th className="px-4 py-3 font-medium text-fg-subtle">Traditional</th>
                <th className="px-4 py-3 font-medium text-fg-subtle">Crypto receivables</th>
                <th className="px-4 py-3 font-semibold text-brand">cashmeifyoucan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <CmpRow label="Minimum invoice" a="$50,000+" b="$5,000+" c="$100" />
              <CmpRow label="Time to funding" a="5 to 10 days" b="24 to 48 hrs" c="~30 seconds" />
              <CmpRow label="Fee discovery" a="Negotiated" b="Fixed schedule" c="Real-time AI auction" />
              <CmpRow label="Who it's for" a="Corporates" b="Crypto-native" c="Anyone" />
              <CmpRow label="Privacy" a="Public" b="On-chain visible" c="Optional private" />
            </tbody>
          </table>
        </motion.div>
        <motion.p {...fade} className="mx-auto mt-5 max-w-2xl text-center text-sm text-fg-subtle">
          The same engine factors any receivable: musician royalties, gig wages, tax refunds, medical
          claims. An invoice is just the first input.
        </motion.p>
      </section>

      {/* ====================== FINAL CTA ====================== */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <motion.div
          {...fade}
          className="rounded-lg border border-line bg-surface-2/50 p-8 text-center sm:p-12"
        >
          <h2 className="mx-auto max-w-2xl font-display text-2xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">
            Get paid today, not in 60 days.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-fg-muted">
            Upload an invoice and have competing offers in under a minute.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        <footer className="mt-12 border-t border-line pt-7">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
              Tokenized on Hedera, settled on Arc, private with Unlink
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
            Sources: U.S. freelance workforce, Upwork/Statista (~70M). Global factoring market, FCI
            ~$3.7T (2024). Stats above reflect live testnet activity from this demo.
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

function HeroStat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface/70 px-3 py-3">
      <div className="font-display text-xl font-bold tracking-tight text-fg sm:text-2xl">{big}</div>
      <div className="mt-0.5 text-xs text-fg-subtle">{label}</div>
    </div>
  );
}

function Timeline({ day, text }: { day: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-14 shrink-0 text-sm font-semibold text-fg-subtle">{day}</span>
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
        'relative rounded-lg border p-5 ' +
        (tone === 'brand' ? 'border-brand/40 bg-brand/[0.06] shadow-sm' : 'border-line bg-surface')
      }
    >
      {winner && (
        <span className="absolute -top-3 right-5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-brand">
          Best deal
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className={
            'grid h-9 w-9 place-items-center rounded-lg text-sm font-bold ' +
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
      <div className={'mt-4 font-display text-3xl font-bold tracking-tight tnum ' + (tone === 'brand' ? 'text-brand' : 'text-fg')}>
        {net}
      </div>
      <div className="text-sm text-fg-subtle">you get</div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-fg-muted">agent earns</span>
        <span className="font-semibold text-fg tnum">{fee}</span>
      </div>
    </div>
  );
}
