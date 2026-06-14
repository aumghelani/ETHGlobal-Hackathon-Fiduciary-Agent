'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/Money';
import { useUI } from '@/components/providers';

function celebrate() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const brand = ['#10B981', '#34D399', '#6366F1'];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: brand, scalar: 0.9 });
}

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
  privatePayoutTxHash: string | null;
  privatePayoutUrl: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SettlePage() {
  const params = useParams();
  const { proMode } = useUI();
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
      await sleep(550);
      setStep(2);
      await sleep(550);
      setStep(3);
      celebrate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSettling(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Demo control</p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">Settlement</h1>
      <p className="mt-1 text-sm text-fg-muted">Simulate the client paying — watch the money flow through.</p>

      {summary && (
        <div className="mt-5 rounded-lg border border-line bg-surface p-4 text-sm shadow-sm">
          <div className="flex justify-between"><span className="text-fg-muted">Client</span><span className="font-medium text-fg">{summary.clientName}</span></div>
          <div className="mt-1.5 flex justify-between"><span className="text-fg-muted">Invoice amount</span><span className="font-medium text-fg"><Money usd={summary.amountUsd} /></span></div>
          {summary.agentName && (
            <div className="mt-1.5 flex justify-between"><span className="text-fg-muted">Winning agent</span><span className="font-medium text-fg">{summary.agentName}</span></div>
          )}
        </div>
      )}

      <Button className="mt-6 w-full" size="lg" onClick={handleSettle} disabled={settling || step >= 3}>
        {settling ? (
          <>
            <Loader2 className="mr-2 animate-spin" size={16} /> Processing payment…
          </>
        ) : step >= 3 ? (
          'Settled ✓'
        ) : (
          'Simulate client payment'
        )}
      </Button>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {/* Step 1 — money reaches investors */}
        <CascadeStep active={step >= 1} title="Client payment received" done={step >= 1}>
          {result && (
            <>
              Client paid <Money usd={summary?.amountUsd ?? 0} maxFractionDigits={0} /> → investors received{' '}
              <span className="font-medium text-fg">
                <Money usd={result.distributedToInvestorsUsd} />
              </span>
              .
              {proMode && (
                <a href={result.arcscanUrl} target="_blank" rel="noopener" className="ml-1 text-fg-subtle underline hover:text-fg-muted">
                  View on Arc ↗
                </a>
              )}
            </>
          )}
          {partial && (
            <>
              Payment settled.
              {proMode && (
                <a href={partial.arcscanUrl} target="_blank" rel="noopener" className="ml-1 text-fg-subtle underline hover:text-fg-muted">
                  View on Arc ↗
                </a>
              )}
            </>
          )}
        </CascadeStep>

        {/* Step 2 — distribution fires */}
        <CascadeStep
          active={step >= 2 || !!partial}
          title="Payouts distributed to backers"
          done={step >= 2}
          failed={!!partial}
        >
          {result && step >= 2 && (
            <>
              Each backer&apos;s share was sent automatically.
              {proMode && (
                <a href={result.hashscanScheduleUrl} target="_blank" rel="noopener" className="ml-1 text-fg-subtle underline hover:text-fg-muted">
                  Verify on Hedera ↗
                </a>
              )}
            </>
          )}
          {partial && <>Could not complete the distribution — payment already settled.</>}
        </CascadeStep>

        {/* Private backers — only shown when a private (Unlink) payout fired */}
        {result?.privatePayoutTxHash && (
          <CascadeStep active={step >= 2} title="Private backers paid out" done={step >= 2}>
            {step >= 2 && (
              <>
                Backers who funded privately received their share — sealed from everyone else.
                {proMode && result.privatePayoutUrl && (
                  <a href={result.privatePayoutUrl} target="_blank" rel="noopener" className="ml-1 text-fg-subtle underline hover:text-fg-muted">
                    Private withdraw ↗
                  </a>
                )}
              </>
            )}
          </CascadeStep>
        )}

        {/* Step 3 — reputation */}
        <CascadeStep active={step >= 3} title="Agent reputation updated" done={step >= 3}>
          {result && step >= 3 && summary?.agentName && (
            <>
              {summary.agentName}:{' '}
              <span className="font-medium text-fg tnum">
                {result.agentReputationBefore?.toFixed(2)} → {result.agentReputationAfter?.toFixed(2)}
              </span>
            </>
          )}
        </CascadeStep>
      </div>

      {step >= 3 && (
        <Link
          href={`/invest/${invoiceId}`}
          className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          View invoice <ArrowRight size={15} />
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
    <div
      className={
        'flex items-start gap-3 rounded-md border p-3.5 transition-all duration-300 ' +
        (active ? 'border-line bg-surface shadow-sm' : 'border-line/60 opacity-40')
      }
    >
      <span className="mt-0.5 shrink-0">
        {failed ? (
          <AlertCircle size={18} className="text-warn" />
        ) : done ? (
          <CheckCircle2 size={18} className="text-brand" />
        ) : (
          <Loader2 size={18} className={active ? 'animate-spin text-fg-subtle' : 'text-fg-subtle/50'} />
        )}
      </span>
      <div>
        <div className="text-sm font-medium text-fg">{title}</div>
        {children && <div className="mt-1 text-sm text-fg-muted">{children}</div>}
      </div>
    </div>
  );
}
