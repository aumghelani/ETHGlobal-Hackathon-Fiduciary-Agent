'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, AlertCircle, ArrowDownRight } from 'lucide-react';
import { BidCard } from '@/components/BidCard';
import { HcsAuditLink } from '@/components/HcsAuditLink';
import { useUI } from '@/components/providers';
import type { Bid } from '@fiduciary/agents';

export default function AuctionPage() {
  const params = useParams();
  const router = useRouter();
  const { proMode } = useUI();
  const invoiceId = params.id as string;

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  // HCS attestation for the subtle "Audit log on Hedera" link (surfaced here, after
  // the hash was committed at upload — earlier in the flow than /invest).
  const [hcs, setHcs] = useState<{ seq: number | null; topicId: string | null }>({ seq: null, topicId: null });

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.invoice) setHcs({ seq: d.invoice.hcsSequenceNumber ?? null, topicId: d.hcsTopicId ?? null });
      })
      .catch(() => {});
  }, [invoiceId]);

  useEffect(() => {
    let cancelled = false;

    async function runAuction() {
      try {
        const res = await fetch(`/api/auctions/${invoiceId}/start`, { method: 'POST' });
        if (!res.ok) throw new Error('Auction failed to start');
        const data = await res.json();
        if (!cancelled) {
          // Stagger reveal — veteran first, newbie 600ms later
          if (data.bids.length === 1) {
            setBids(data.bids);
          } else if (data.bids.length > 1) {
            setBids([data.bids[0]]);
            setTimeout(() => {
              if (!cancelled) setBids(data.bids);
            }, 600);
          }
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    runAuction();
    return () => { cancelled = true; };
  }, [invoiceId]);

  const handleAccept = async (bid: Bid) => {
    setAccepting(bid.agentName);
    try {
      const res = await fetch(`/api/auctions/${invoiceId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: bid.agentName }),
      });
      if (!res.ok) throw new Error('Failed to secure offer');
      const data = await res.json();
      console.log('Tokenized:', data);
      router.push(`/invest/${invoiceId}?from=accept`);
    } catch (e: any) {
      setAccepting(null);
      setError(e.message);
    }
  };

  // Determine which bid is the "best offer" (highest netToFreelancer)
  const bestBid = bids.length > 0
    ? bids.reduce((max, b) => b.netToFreelancer > max.netToFreelancer ? b : max)
    : null;

  const vetBid = bids.find(b => b.agentName === 'Veteran Agent');
  const newbieBid = bids.find(b => b.agentName === 'Newbie Agent');

  const bothIn = bids.length === 2 && vetBid && newbieBid;
  const stillBidding = bids.length < 2;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-fg-muted"
        >
          <span className={'h-1.5 w-1.5 rounded-full ' + (stillBidding ? 'animate-pulse bg-brand' : 'bg-fg-subtle')} />
          {stillBidding ? 'Auction live' : 'Bids in — choose your offer'}
        </motion.div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-fg">
          {stillBidding ? 'Agents are competing for your invoice' : 'Two offers. Your choice.'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-fg-muted">
          The better the agent, the less they charge — watch the gap.
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Bid cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <BidCard
          agentName="Veteran Agent"
          reputationScore={4.8}
          completedDeals={500}
          bid={vetBid || null}
          highlight={bestBid?.agentName === 'Veteran Agent'}
          tokenizing={accepting === 'Veteran Agent'}
          disabled={accepting !== null && accepting !== 'Veteran Agent'}
          onAccept={() => vetBid && handleAccept(vetBid)}
        />
        <BidCard
          agentName="Newbie Agent"
          reputationScore={0.5}
          completedDeals={0}
          bid={newbieBid || null}
          highlight={bestBid?.agentName === 'Newbie Agent'}
          tokenizing={accepting === 'Newbie Agent'}
          disabled={accepting !== null && accepting !== 'Newbie Agent'}
          onAccept={() => newbieBid && handleAccept(newbieBid)}
        />
      </div>

      {/* The inversion — the punchline, as a polished insight panel with a mini viz */}
      {bothIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 overflow-hidden rounded-lg border border-brand/30 bg-brand/[0.06]"
        >
          <div className="flex items-center gap-2 border-b border-brand/20 px-5 py-3">
            <Sparkles size={16} className="text-brand" />
            <span className="text-sm font-semibold text-fg">The counterintuitive part</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <InsightStat
              label="Veteran pays you more"
              big={`+$${(vetBid!.netToFreelancer - newbieBid!.netToFreelancer).toFixed(2)}`}
              sub={`$${vetBid!.netToFreelancer.toLocaleString()} vs $${newbieBid!.netToFreelancer.toLocaleString()}`}
              tone="up"
            />
            <InsightStat
              label="…yet the Veteran earns less"
              big={`−$${(newbieBid!.agentEarnings - vetBid!.agentEarnings).toFixed(2)}`}
              sub={`$${vetBid!.agentEarnings.toFixed(2)} vs $${newbieBid!.agentEarnings.toFixed(2)} fee`}
              tone="down"
            />
          </div>
          <p className="px-5 pb-5 text-sm leading-relaxed text-fg-muted">
            Trust is a fee <span className="font-medium text-fg">compressor</span>, not a multiplier. The
            market prices away the veteran&apos;s risk premium — so the most reputable agent offers the best deal.
          </p>
        </motion.div>
      )}

      {loading && stillBidding && (
        <p className="mt-6 text-center text-sm text-fg-subtle">Typically takes 2–4 seconds</p>
      )}

      {/* On-chain attribution — subtle by default, fuller in Pro mode */}
      {hcs.seq !== null && hcs.topicId && (
        <div className="mt-12 flex flex-col items-center gap-1 border-t border-line pt-6">
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <CheckCircle2 size={13} className="text-brand/70" />
            This invoice is committed to the audit log.
          </p>
          {proMode && (
            <p className="max-w-md text-center text-xs text-fg-subtle">
              The agent you accept tokenizes your invoice on Hedera and sets its fee at the protocol level.
            </p>
          )}
          <HcsAuditLink seq={hcs.seq} topicId={hcs.topicId} className="text-xs text-fg-subtle" />
        </div>
      )}
    </div>
  );
}

function InsightStat({
  label,
  big,
  sub,
  tone,
}: {
  label: string;
  big: string;
  sub: string;
  tone: 'up' | 'down';
}) {
  return (
    <div className="rounded-md bg-surface/70 p-4">
      <div className="text-xs font-medium text-fg-muted">{label}</div>
      <div
        className={
          'mt-1 flex items-center gap-1 font-display text-2xl font-bold tracking-tight ' +
          (tone === 'up' ? 'text-brand' : 'text-accent')
        }
      >
        <ArrowDownRight size={18} className={tone === 'up' ? 'rotate-180' : ''} />
        {big}
      </div>
      <div className="mt-1 text-xs text-fg-subtle">{sub}</div>
    </div>
  );
}
