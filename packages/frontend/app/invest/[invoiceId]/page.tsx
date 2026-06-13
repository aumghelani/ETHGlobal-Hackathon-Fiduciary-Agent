'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Money, AnimatedNumber } from '@/components/Money';
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
  const invoiceId = params.invoiceId as string;

  const [data, setData] = useState<InvestData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [share, setShare] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

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
    return <p className="text-fg-muted">This invoice isn&apos;t available to fund yet.</p>;
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
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-brand/30 bg-brand/[0.07] p-7 text-center"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/15">
            <CheckCircle2 className="text-brand" size={30} />
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg">Settled</h1>
          <p className="mt-1.5 text-sm text-fg-muted">This invoice has been paid by the client.</p>
        </motion.div>

        <Card className="mt-5 divide-y divide-line">
          <Row label="Client" value={data.clientName} />
          <Row label="Invoice amount" value={<Money usd={data.amountUsd} />} />
          <Row
            label="Investors received"
            value={<Money usd={data.investorsReceivedUsd} className="font-semibold text-brand" />}
          />
          {data.agentName && (
            <Row label={`${data.agentName} earned`} value={<Money usd={data.agentEarnedUsd} />} />
          )}
        </Card>

        <div className="mt-4">
          <HcsAuditLink seq={data.hcsSequenceNumber} topicId={data.hcsTopicId} />
          <AgentWalletLink address={data.agentWalletAddress} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold tracking-tight text-fg">Fund this invoice</h1>

      <Card className="mt-5 divide-y divide-line">
        <Row label="Client" value={data.clientName} />
        <Row label="Invoice amount" value={<Money usd={data.amountUsd} />} />
        <Row label="Payment expected" value={`${data.daysUntilDue} days`} />
        {data.agentName && data.feePercent !== null && (
          <Row label="Managed by" value={`${data.agentName} · ${data.feePercent}% fee`} />
        )}
      </Card>

      {/* Funding progress */}
      <div className="mt-6">
        <div className="flex items-end justify-between">
          <div className="font-display text-2xl font-bold text-fg tnum">
            <AnimatedNumber value={fundedDollars} prefix="$" />
          </div>
          <span className="text-sm text-fg-muted">of ${net.toLocaleString()}</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {(data.publicInvestorCount > 0 || data.privateInvestorCount > 0) && (
          <p className="mt-2 text-xs text-fg-subtle">
            {data.publicInvestorCount} public · {data.privateInvestorCount} private investor
            {data.privateInvestorCount === 1 ? '' : 's'}
          </p>
        )}
        {data.pool.funded && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand">
            <CheckCircle2 size={15} /> Fully funded — the freelancer has been paid.
          </p>
        )}
        {data.status === 'funding' && data.pool.funded && (
          <Link
            href={`/settle/${invoiceId}`}
            className="mt-3 inline-block text-xs font-medium text-fg-subtle hover:text-fg-muted hover:underline"
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
              'flex w-full items-center justify-between rounded-md border px-3.5 py-2.5 text-left transition-colors ' +
              (isPrivate ? 'border-brand/50 bg-brand/[0.06]' : 'border-line bg-surface hover:bg-surface-2')
            }
          >
            <span className="flex items-center gap-2 text-sm font-medium text-fg">
              <Lock size={14} className={isPrivate ? 'text-brand' : 'text-fg-subtle'} />
              Buy privately
            </span>
            <span className={'relative h-5 w-9 rounded-full transition-colors ' + (isPrivate ? 'bg-brand' : 'bg-surface-3')}>
              <span className={'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ' + (isPrivate ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </button>
          {isPrivate && (
            <p className="text-xs text-fg-muted">
              Your position stays sealed from other investors.{' '}
              <span className="text-fg-subtle">Privacy by Unlink.</span>
            </p>
          )}

          <label className="block text-sm font-medium text-fg">Your share (in dollars)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">$</span>
            <Input
              type="number"
              placeholder="500"
              className="pl-7"
              value={share}
              onChange={(e) => setShare(e.target.value)}
            />
          </div>
          <p className="text-xs text-fg-subtle">
            You can fund up to ${Math.floor(net - fundedDollars).toLocaleString()} more.
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={funding}>
            {funding ? 'Funding…' : 'Buy a piece'}
          </Button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      )}

      <div className="mt-2">
        <HcsAuditLink seq={data.hcsSequenceNumber} topicId={data.hcsTopicId} />
        <AgentWalletLink address={data.agentWalletAddress} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}
