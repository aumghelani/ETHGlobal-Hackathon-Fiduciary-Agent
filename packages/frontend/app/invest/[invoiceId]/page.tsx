'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, X, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HcsAuditLink } from '@/components/HcsAuditLink';
import { AgentWalletLink } from '@/components/AgentWalletLink';

type InvestData = {
  clientName: string;
  amountUsd: number;
  daysUntilDue: number;
  netToFreelancer: number | null;
  agentName: string | null;
  feePercent: number | null;
  status: string;
  pool: { raised: number; target: number; remaining: number; funded: boolean };
  privateRaisedUsd: number;
  displayedTotalUsd: number;
  publicInvestorCount: number;
  privateInvestorCount: number;
  agentEarnedUsd: number;
  investorsReceivedUsd: number;
  hcsSequenceNumber: number | null;
  hcsTopicId: string | null;
  agentWalletAddress: string | null;
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
  const [isPrivate, setIsPrivate] = useState(false);
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
      setError('Enter an amount in dollars greater than zero.');
      return;
    }
    setFunding(true);
    try {
      const endpoint = isPrivate
        ? `/api/invest/${invoiceId}/fund-private`
        : `/api/invest/${invoiceId}/fund`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: amount }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? 'Could not fund this invoice. Please try again.');
        return;
      }
      // Public returns pool state; private returns combined totals — refresh to get
      // the unified picture either way.
      await refresh();
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
  // Combined total = public (mapped from pool) + private (from store), in dollars.
  const fundedDollars = Math.round(data.displayedTotalUsd);
  const percent = net > 0 ? Math.min(100, Math.round((data.displayedTotalUsd / net) * 100)) : 0;

  // Settled — the client has paid and the distribution has fired. Replace the whole
  // funding surface with the closing-the-loop summary.
  if (data.status === 'settled') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h1 className="mt-2 text-2xl font-bold text-emerald-900">Settled</h1>
          <p className="mt-2 text-sm text-emerald-800">
            This invoice has been paid by the client.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
          <div>Client: {data.clientName}</div>
          <div>Invoice amount: ${data.amountUsd.toLocaleString()}</div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            Investors received $
            {data.investorsReceivedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}.
          </div>
          {data.agentName && (
            <div>
              {data.agentName} earned $
              {data.agentEarnedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}.
            </div>
          )}
        </div>

        <HcsAuditLink seq={data.hcsSequenceNumber} topicId={data.hcsTopicId} />
        <AgentWalletLink address={data.agentWalletAddress} className="mt-2 text-center text-xs text-slate-400" />
      </div>
    );
  }

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
        {(data.publicInvestorCount > 0 || data.privateInvestorCount > 0) && (
          <p className="mt-2 text-xs text-slate-400">
            {data.publicInvestorCount} public investor
            {data.publicInvestorCount === 1 ? '' : 's'} · {data.privateInvestorCount} private investor
            {data.privateInvestorCount === 1 ? '' : 's'}
          </p>
        )}
        {data.pool.funded && (
          <p className="mt-2 text-sm font-medium text-emerald-700">
            Fully funded — the freelancer has been paid.
          </p>
        )}
        {data.status === 'funding' && data.pool.funded && (
          <Link
            href={`/settle/${invoiceId}`}
            className="mt-3 inline-block text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline"
          >
            Trigger settlement (demo only) →
          </Link>
        )}
      </div>

      {!data.pool.funded && (
        <form className="mt-6 space-y-3" onSubmit={handleFund}>
          <button
            type="button"
            onClick={() => setIsPrivate((v) => !v)}
            className={
              'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ' +
              (isPrivate
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white')
            }
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <Lock size={14} className={isPrivate ? 'text-emerald-600' : 'text-slate-400'} />
              Buy privately
            </span>
            <span
              className={
                'relative h-5 w-9 rounded-full transition-colors ' +
                (isPrivate ? 'bg-emerald-500' : 'bg-slate-300')
              }
            >
              <span
                className={
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ' +
                  (isPrivate ? 'left-[18px]' : 'left-0.5')
                }
              />
            </span>
          </button>
          {isPrivate && (
            <p className="text-xs text-emerald-700">
              Your position stays sealed from other investors.
            </p>
          )}

          <label className="text-sm font-medium text-slate-700">Your share (in dollars)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input
              type="number"
              placeholder="500"
              className="pl-7"
              value={share}
              onChange={(e) => setShare(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400">
            Enter amount in dollars. You can fund up to $
            {Math.floor(net - fundedDollars).toLocaleString()} more.
          </p>
          <Button type="submit" className="w-full" disabled={funding}>
            {funding ? 'Funding...' : 'Buy a piece'}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <HcsAuditLink seq={data.hcsSequenceNumber} topicId={data.hcsTopicId} />
      <AgentWalletLink address={data.agentWalletAddress} />
    </div>
  );
}
