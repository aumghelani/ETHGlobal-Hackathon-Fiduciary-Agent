'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Loader2, ArrowRight, Banknote, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money, AnimatedNumber } from '@/components/Money';
import { useUI } from '@/components/providers';
import { HcsAuditLink } from '@/components/HcsAuditLink';

// Maria's post-accept moment. She just SOLD her invoice — this celebrates HER outcome
// (cash on the way), it does NOT ask her to invest. Abstracted by default; Pro mode
// reveals the on-chain attestation. Distinct from /invest/[id] (the investor surface).

type Data = {
  clientName: string;
  amountUsd: number;
  netToFreelancer: number | null;
  agentName: string | null;
  hcsSequenceNumber: number | null;
  hcsTopicId: string | null;
};

const STEPS = [
  { icon: ShieldCheck, label: 'Invoice verified' },
  { icon: Sparkles, label: 'Offer secured with your agent' },
  { icon: Banknote, label: 'Cash on its way to your account' },
];

export default function FundedPage() {
  const params = useParams();
  const { proMode } = useUI();
  const invoiceId = params.invoiceId as string;

  const [data, setData] = useState<Data | null>(null);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    fetch(`/api/invest/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [invoiceId]);

  // Stagger the status steps, then a celebratory burst.
  useEffect(() => {
    if (!data) return;
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => timers.push(setTimeout(() => setRevealed(i + 1), 400 + i * 600)));
    timers.push(
      setTimeout(() => {
        if (!reduce) confetti({ particleCount: 110, spread: 75, origin: { y: 0.35 }, colors: ['#10B981', '#34D399', '#6366F1'], scalar: 0.9 });
      }, 400 + STEPS.length * 600)
    );
    return () => timers.forEach(clearTimeout);
  }, [data]);

  const net = data?.netToFreelancer ?? data?.amountUsd ?? 0;

  return (
    <div className="mx-auto max-w-lg">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/15">
          <CheckCircle2 className="text-brand" size={34} />
        </span>
        <p className="mt-5 text-sm font-medium text-fg-muted">You&apos;re funded</p>
        <div className="mt-1 font-display text-5xl font-bold tracking-tight text-fg tnum">
          {data ? <AnimatedNumber value={net} prefix="$" durationMs={900} /> : <span className="text-fg-subtle">$—</span>}
        </div>
        <p className="mt-2 text-fg-muted">
          is on its way to your account{data?.clientName ? ` for the ${data.clientName} invoice` : ''}.
        </p>
      </motion.div>

      {/* Status timeline */}
      <div className="mt-9 space-y-3">
        {STEPS.map((s, i) => {
          const done = revealed > i;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done ? 1 : 0.4, x: 0 }}
              transition={{ duration: 0.3 }}
              className={
                'flex items-center gap-3 rounded-md border p-3.5 transition-all ' +
                (done ? 'border-line bg-surface shadow-sm' : 'border-line/60')
              }
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand/12 text-brand">
                {done ? <CheckCircle2 size={16} /> : <Loader2 size={16} className="animate-spin" />}
              </span>
              <span className="text-sm font-medium text-fg">{s.label}</span>
            </motion.div>
          );
        })}
      </div>

      {data?.agentName && (
        <p className="mt-5 text-center text-sm text-fg-muted">
          Managed by <span className="font-medium text-fg">{data.agentName}</span> — they&apos;ll collect from your
          client so you don&apos;t have to chase it.
        </p>
      )}

      {/* Cash-to-bank rail (Blink). Abstracted as "your bank" by default; Pro mode is honest
          that the fiat off-ramp is stubbed (Blink can't move fiat — seam for a real provider). */}
      {data && (
        <div className="mt-6 flex items-center justify-between rounded-md border border-line bg-surface-2 p-3.5">
          <span className="flex items-center gap-2 text-sm text-fg-muted">
            <Banknote size={15} className="text-brand" />
            Cash routed to your bank account
          </span>
          <span className="text-xs font-medium text-fg-subtle">via Blink</span>
        </div>
      )}
      {proMode && data && (
        <p className="mt-1.5 text-center text-[11px] text-fg-subtle">
          Off-ramp is stubbed — Blink is a deposit SDK with no fiat rail; seam for a real payout provider in lib/blink.ts.
        </p>
      )}

      {/* Next steps — explicit, optional. NOT an investor form. */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/upload">
            Fund another invoice <ArrowRight size={17} className="ml-1" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href="/">Back home</Link>
        </Button>
      </div>

      {/* On-chain attestation — subtle, fuller in Pro mode */}
      {data && (
        <div className="mt-8 border-t border-line pt-5 text-center">
          {proMode && (
            <p className="mb-1 text-xs text-fg-subtle">Your invoice is tokenized and audit-logged on-chain.</p>
          )}
          <HcsAuditLink seq={data.hcsSequenceNumber} topicId={data.hcsTopicId} />
        </div>
      )}
    </div>
  );
}
