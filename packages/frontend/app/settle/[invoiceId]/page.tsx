'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Summary = {
  clientName: string;
  amountUsd: number;
  agentName: string | null;
};

type SettleResult = {
  arcTxHash: string;
  arcscanUrl: string;
  hederaScheduleExecTxId: string;
  hashscanScheduleUrl: string;
  agentReputationBefore: number | null;
  agentReputationAfter: number | null;
  distributedToAgentUsd: number;
  distributedToInvestorsUsd: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SettlePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SettleResult | null>(null);
  const [partial, setPartial] = useState<{ arcTxHash: string; arcscanUrl: string } | null>(null);
  const [step, setStep] = useState(0); // 0 none, 1/2/3 revealed

  useEffect(() => {
    fetch(`/api/invest/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSummary({ clientName: d.clientName, amountUsd: d.amountUsd, agentName: d.agentName }))
      .catch(() => {});
  }, [invoiceId]);

  async function handleSettle() {
    setError('');
    setPartial(null);
    setResult(null);
    setStep(0);
    setSettling(true);
    try {
      const res = await fetch(`/api/settle/${invoiceId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.partial && data.arcTxHash) {
          setPartial({ arcTxHash: data.arcTxHash, arcscanUrl: data.arcscanUrl });
          setStep(1); // step 1 landed, step 2 failed
        } else {
          setError(data.error ?? 'Settlement failed. Please try again.');
        }
        return;
      }
      setResult(data);
      setStep(1);
      await sleep(450);
      setStep(2);
      await sleep(450);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSettling(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Demo control</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Settlement</h1>

      {summary && (
        <div className="mt-4 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
          <div>Client: {summary.clientName}</div>
          <div>Invoice amount: ${summary.amountUsd.toLocaleString()}</div>
          {summary.agentName && <div>Winning agent: {summary.agentName}</div>}
        </div>
      )}

      <Button className="mt-6 w-full" size="lg" onClick={handleSettle} disabled={settling}>
        {settling ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={16} /> Processing payment...
          </>
        ) : (
          'Simulate client payment'
        )}
      </Button>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {/* Step 1 — Client payment received */}
        <CascadeStep
          active={step >= 1}
          title="Client payment received"
          done={step >= 1}
        >
          {result && (
            <>
              Client paid ${summary?.amountUsd.toLocaleString()} → investors received $
              {result.distributedToInvestorsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}.{' '}
              <a href={result.arcscanUrl} target="_blank" rel="noopener" className="text-slate-400 underline hover:text-slate-600">
                View on Arc ↗
              </a>
            </>
          )}
          {partial && (
            <>
              Payment settled.{' '}
              <a href={partial.arcscanUrl} target="_blank" rel="noopener" className="text-slate-400 underline hover:text-slate-600">
                View on Arc ↗
              </a>
            </>
          )}
        </CascadeStep>

        {/* Step 2 — Distribution executing */}
        <CascadeStep
          active={step >= 2 || (!!partial)}
          title="Distribution executing on the agent network"
          done={step >= 2}
          failed={!!partial}
        >
          {result && step >= 2 && (
            <>
              Distribution schedule fired.{' '}
              <a href={result.hashscanScheduleUrl} target="_blank" rel="noopener" className="text-slate-400 underline hover:text-slate-600">
                Verification on Hedera ↗
              </a>
            </>
          )}
          {partial && <>Could not complete the distribution schedule — payment already settled.</>}
        </CascadeStep>

        {/* Step 3 — Reputation updated */}
        <CascadeStep active={step >= 3} title="Agent reputation updated" done={step >= 3}>
          {result && step >= 3 && summary?.agentName && (
            <>
              {summary.agentName} reputation:{' '}
              {result.agentReputationBefore?.toFixed(2)} → {result.agentReputationAfter?.toFixed(2)}
            </>
          )}
        </CascadeStep>
      </div>

      {step >= 3 && (
        <Link href={`/invest/${invoiceId}`} className="mt-8 inline-block text-sm font-medium text-primary hover:underline">
          View invoice →
        </Link>
      )}
    </div>
  );
}

function CascadeStep({
  active,
  done,
  failed = false,
  title,
  children,
}: {
  active: boolean;
  done: boolean;
  failed?: boolean;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={'flex items-start gap-3 rounded-lg border p-3 ' + (active ? 'border-slate-200' : 'border-slate-100 opacity-40')}>
      <span className="mt-0.5 shrink-0">
        {failed ? (
          <AlertCircle size={18} className="text-amber-500" />
        ) : done ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <Loader2 size={18} className={active ? 'animate-spin text-slate-400' : 'text-slate-300'} />
        )}
      </span>
      <div>
        <div className="text-sm font-medium text-slate-800">{title}</div>
        {children && <div className="mt-1 text-sm text-slate-600">{children}</div>}
      </div>
    </div>
  );
}
