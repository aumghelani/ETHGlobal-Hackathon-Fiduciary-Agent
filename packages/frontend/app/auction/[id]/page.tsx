'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { BidCard } from '@/components/BidCard';
import type { Bid } from '@fiduciary/agents';

export default function AuctionPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Finding the best offer</h1>
        <p className="text-slate-600 mt-2">
          AI agents are bidding to fund your invoice
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Veteran card */}
        <BidCard
          agentName="Veteran Agent"
          reputationScore={4.8}
          completedDeals={500}
          bid={bids.find(b => b.agentName === 'Veteran Agent') || null}
          highlight={bestBid?.agentName === 'Veteran Agent'}
          tokenizing={accepting === 'Veteran Agent'}
          disabled={accepting !== null && accepting !== 'Veteran Agent'}
          onAccept={() => {
            const b = bids.find(x => x.agentName === 'Veteran Agent');
            if (b) handleAccept(b);
          }}
        />

        {/* Newbie card */}
        <BidCard
          agentName="Newbie Agent"
          reputationScore={0.5}
          completedDeals={0}
          bid={bids.find(b => b.agentName === 'Newbie Agent') || null}
          highlight={bestBid?.agentName === 'Newbie Agent'}
          tokenizing={accepting === 'Newbie Agent'}
          disabled={accepting !== null && accepting !== 'Newbie Agent'}
          onAccept={() => {
            const b = bids.find(x => x.agentName === 'Newbie Agent');
            if (b) handleAccept(b);
          }}
        />
      </div>

      {bids.length === 2 && vetBid && newbieBid && (
        <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-600 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-emerald-900">Notice the difference</h3>
              <p className="text-sm text-emerald-800 mt-1">
                The Veteran agent offers you ${vetBid.netToFreelancer.toLocaleString()} — that&apos;s
                ${(vetBid.netToFreelancer - newbieBid.netToFreelancer).toFixed(2)} more than the Newbie agent.
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                Yet the Veteran earns only ${vetBid.agentEarnings.toFixed(2)}, while the Newbie would
                earn ${newbieBid.agentEarnings.toFixed(2)}.
              </p>
              <p className="text-xs text-emerald-700 mt-2 italic">
                Trusted agents compete harder for your business. Reputation compresses fees — the market
                prices away the risk premium.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && bids.length === 0 && (
        <p className="text-center text-slate-500 mt-6 text-sm">
          Typically takes 2-4 seconds
        </p>
      )}
    </div>
  );
}
