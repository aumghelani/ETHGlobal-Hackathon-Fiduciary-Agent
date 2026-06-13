'use client';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, Quote, Loader2 } from 'lucide-react';
import type { Bid } from '@fiduciary/agents';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/Money';
import { useUI } from '@/components/providers';
import { cn } from '@/lib/utils';

export function BidCard({
  agentName,
  reputationScore,
  completedDeals,
  bid,
  highlight = false,
  tokenizing = false,
  disabled = false,
  onAccept,
}: {
  agentName: string;
  reputationScore: number;
  completedDeals: number;
  bid: Bid | null;
  highlight?: boolean;
  tokenizing?: boolean;
  disabled?: boolean;
  onAccept: () => void;
}) {
  const { proMode } = useUI();
  const isVeteran = completedDeals > 0;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg border bg-surface p-6 transition-shadow',
        highlight
          ? 'border-brand/40 shadow-lg ring-1 ring-brand/30'
          : 'border-line shadow-sm'
      )}
    >
      {highlight && (
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-brand shadow-sm"
        >
          <CheckCircle2 size={12} /> Best offer
        </motion.span>
      )}

      {/* Agent identity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid h-9 w-9 place-items-center rounded-lg text-sm font-bold',
              isVeteran ? 'bg-brand/15 text-brand' : 'bg-accent/15 text-accent'
            )}
          >
            {agentName.charAt(0)}
          </span>
          <div>
            <div className="text-sm font-semibold text-fg">{agentName}</div>
            <div className="flex items-center gap-1 text-xs text-fg-subtle">
              <Star size={11} className="fill-warn text-warn" />
              {reputationScore.toFixed(1)} · {completedDeals === 0 ? 'new' : `${completedDeals} deals`}
            </div>
          </div>
        </div>
      </div>

      {bid === null ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand" size={28} />
          <p className="mt-3 text-sm text-fg-subtle">Analyzing the invoice…</p>
          <div className="mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: '15%' }}
              animate={{ width: ['15%', '70%', '45%', '85%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 flex flex-1 flex-col"
        >
          <div className="font-display text-display-sm font-bold tracking-tight text-fg">
            <Money usd={bid.netToFreelancer} maxFractionDigits={0} />
          </div>
          <p className="mt-0.5 text-sm text-fg-muted">lands in your account</p>

          {/* Terms — discount always; fee revealed in pro mode (it's the agent's cut) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg-muted">
              {bid.discountPercent}% discount
            </span>
            {proMode && (
              <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg-muted">
                {bid.feePercent}% agent fee · earns ${bid.agentEarnings.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-surface-2 p-3 text-sm text-fg-muted">
            <Quote size={14} className="mt-0.5 shrink-0 text-fg-subtle" />
            <p className="leading-relaxed">{bid.reasoning}</p>
          </div>

          <div className="mt-auto pt-5">
            <Button
              className="w-full"
              size="lg"
              variant={highlight ? 'default' : 'outline'}
              disabled={disabled || tokenizing}
              onClick={onAccept}
            >
              {tokenizing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Securing your offer…
                </>
              ) : (
                'Accept this offer'
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
