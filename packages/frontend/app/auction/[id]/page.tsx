'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BidCard } from '@/components/BidCard';
import type { Bid } from '@fiduciary/agents';

export default function AuctionPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleAccept = (bid: Bid) => {
    // For now, just log — wiring to Hedera mint comes in next prompt
    console.log('Accepted bid:', bid);
    alert(`Bid accepted from ${bid.agentName}. Next: tokenize on chain.`);
  };

  // Determine which bid is the "best offer" (highest netToFreelancer)
  const bestBid = bids.length > 0
    ? bids.reduce((max, b) => b.netToFreelancer > max.netToFreelancer ? b : max)
    : null;

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
          onAccept={() => {
            const b = bids.find(x => x.agentName === 'Newbie Agent');
            if (b) handleAccept(b);
          }}
        />
      </div>

      {loading && bids.length === 0 && (
        <p className="text-center text-slate-500 mt-6 text-sm">
          Typically takes 2-4 seconds
        </p>
      )}
    </div>
  );
}
