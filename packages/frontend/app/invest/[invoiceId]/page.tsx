'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type InvestData = {
  clientName: string;
  amountUsd: number;
  daysUntilDue: number;
  netToFreelancer: number | null;
  agentName: string | null;
  feePercent: number | null;
  pool: { raised: number; target: number; remaining: number; funded: boolean };
};

export default function InvestInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.invoiceId as string;

  const [data, setData] = useState<InvestData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [share, setShare] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');
  const [showBanner, setShowBanner] = useState(searchParams.get('from') === 'accept');

  async function refresh() {
    const res = await fetch(`/api/invest/${invoiceId}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoaded(true);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amount = Number(share);
    if (!(amount > 0)) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setFunding(true);
    try {
      const res = await fetch(`/api/invest/${invoiceId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: amount }),
      });
      if (!res.ok) throw new Error('Could not fund this invoice. Please try again.');
      const result = await res.json();
      setData((prev) => (prev ? { ...prev, pool: result.pool } : prev));
      setShare('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFunding(false);
    }
  }

  if (loaded && !data) {
    return <p className="text-slate-600">This invoice isn&apos;t available to fund yet.</p>;
  }
  if (!data) return null;

  const net = data.netToFreelancer ?? data.amountUsd;
  // Map the on-chain pool (small USDC) back to Maria's full dollar net for display.
  const fraction = data.pool.target > 0 ? data.pool.raised / data.pool.target : 0;
  const fundedDollars = Math.round(net * fraction);
  const percent = Math.min(100, Math.round(fraction * 100));

  return (
    <div className="mx-auto max-w-md">
      {showBanner && (
        <div className="relative mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-3 top-3 text-emerald-700/60 hover:text-emerald-800"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h2 className="mt-2 text-lg font-bold text-emerald-900">Your offer is secured</h2>
          <p className="mt-1 text-sm text-emerald-800">
            ${net.toLocaleString()} will arrive in your bank account within 24 hours
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900">Fund this invoice</h1>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
        <div>Client: {data.clientName}</div>
        <div>Amount: ${data.amountUsd.toLocaleString()}</div>
        <div>Payment expected: {data.daysUntilDue} days</div>
        {data.agentName && data.feePercent !== null && (
          <div>
            Managed by {data.agentName} · {data.feePercent}% fee
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-slate-600">
          <span>${fundedDollars.toLocaleString()} funded</span>
          <span>of ${net.toLocaleString()}</span>
        </div>
        <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {data.pool.funded && (
          <p className="mt-2 text-sm font-medium text-emerald-700">
            Fully funded — the freelancer has been paid.
          </p>
        )}
      </div>

      {!data.pool.funded && (
        <form className="mt-6 space-y-3" onSubmit={handleFund}>
          <label className="text-sm font-medium text-slate-700">Your share</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input
              type="number"
              placeholder="100"
              className="pl-7"
              value={share}
              onChange={(e) => setShare(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={funding}>
            {funding ? 'Funding...' : 'Buy a piece'}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
