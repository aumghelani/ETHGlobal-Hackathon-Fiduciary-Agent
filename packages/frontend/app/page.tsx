'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="py-6 sm:py-10">
      {/* Hero */}
      <section className="relative">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-fg-muted"
        >
          <Sparkles size={13} className="text-brand" />
          AI-powered invoice factoring
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-fg sm:text-display-lg"
        >
          Get paid today,
          <br />
          <span className="text-brand">not in 60 days.</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted"
        >
          Upload an unpaid invoice and AI agents compete to advance you cash. Investors back it and earn
          yield when your client pays. The better the agent, the less it charges.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="/upload">
              Get funded <ArrowRight size={18} className="ml-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/invest">Invest &amp; earn yield</Link>
          </Button>
        </motion.div>
      </section>

      {/* How it works — bento */}
      <section className="mt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Cash in minutes',
              body: 'Agents bid in a live auction. Accept the best offer and the money lands in your account — not in two months.',
            },
            {
              icon: TrendingUp,
              title: 'Yield for investors',
              body: 'Back a fraction of an invoice and earn the discount when the client settles. Real-world cash flow, on-chain.',
            },
            {
              icon: ShieldCheck,
              title: 'Trust, priced in',
              body: 'Every invoice is verified and audited. Reputable agents charge less — the market prices away their risk premium.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/12 text-brand">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-4 font-semibold text-fg">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The inversion teaser */}
      <section className="mt-12">
        <Card className="overflow-hidden">
          <div className="grid items-center gap-6 p-7 sm:grid-cols-[1.2fr_1fr] sm:p-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">The counterintuitive part</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg">
                The most trusted agent gives you the best deal.
              </h2>
              <p className="mt-2 text-fg-muted">
                A veteran agent offers a smaller discount <em>and</em> charges a lower fee than a newcomer.
                Trust is a fee compressor, not a multiplier.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniCompare label="Newcomer" net="$4,500" fee="$300" tone="muted" />
              <MiniCompare label="Veteran" net="$4,900" fee="$40" tone="brand" />
            </div>
          </div>
        </Card>
      </section>

      {/* Sponsor attribution — subtle */}
      <footer className="mt-16 border-t border-line pt-6">
        <p className="text-center text-xs font-medium text-fg-subtle">
          Settlement on Hedera · Arc · Unlink
        </p>
      </footer>
    </div>
  );
}

function MiniCompare({
  label,
  net,
  fee,
  tone,
}: {
  label: string;
  net: string;
  fee: string;
  tone: 'brand' | 'muted';
}) {
  return (
    <div
      className={
        'rounded-md border p-4 ' +
        (tone === 'brand' ? 'border-brand/40 bg-brand/[0.06]' : 'border-line bg-surface-2')
      }
    >
      <div className="text-xs font-medium text-fg-muted">{label}</div>
      <div className={'mt-1.5 font-display text-2xl font-bold tnum ' + (tone === 'brand' ? 'text-brand' : 'text-fg')}>
        {net}
      </div>
      <div className="text-xs text-fg-subtle">you get</div>
      <div className="mt-2 text-xs text-fg-muted">
        agent earns <span className="font-medium text-fg">{fee}</span>
      </div>
    </div>
  );
}
