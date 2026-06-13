'use client';
import { motion } from 'framer-motion';
import { Upload, Gavel, Coins, Users, Send } from 'lucide-react';

// A clean, visual pipeline diagram (not the full ARCHITECTURE.md). Each stage tags the
// sponsor doing the work — so judges see the integration story at a glance.
const STAGES = [
  { icon: Upload, title: 'Upload invoice', sub: 'Verified & hashed', tag: 'World ID + HCS', tone: 'accent' },
  { icon: Gavel, title: 'Agents bid', sub: 'Reputation-priced auction', tag: 'AI agents', tone: 'fg' },
  { icon: Coins, title: 'Tokenize', sub: 'Custom fee = winning bid', tag: 'Hedera HTS', tone: 'brand' },
  { icon: Users, title: 'Investors fund', sub: 'Public or private', tag: 'Arc + Unlink', tone: 'brand' },
  { icon: Send, title: 'Client pays', sub: 'Auto-distribute', tag: 'Hedera HSS', tone: 'accent' },
] as const;

function tagClasses(tone: string) {
  if (tone === 'brand') return 'bg-brand/10 text-brand';
  if (tone === 'accent') return 'bg-accent/10 text-accent';
  return 'bg-surface-3 text-fg-muted';
}

export function ArchitectureFlow() {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      {STAGES.map((s, i) => (
        <div key={s.title} className="flex flex-1 items-center gap-3 lg:flex-col lg:gap-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="flex w-full flex-1 items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm lg:flex-col lg:items-center lg:text-center"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg">
              <s.icon size={18} />
            </span>
            <div className="min-w-0 lg:mt-1">
              <div className="text-sm font-semibold text-fg">{s.title}</div>
              <div className="text-xs text-fg-subtle">{s.sub}</div>
              <span className={'mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-medium ' + tagClasses(s.tone)}>
                {s.tag}
              </span>
            </div>
          </motion.div>

          {i < STAGES.length - 1 && (
            <span className="shrink-0 text-fg-subtle lg:rotate-90" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
