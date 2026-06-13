'use client';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';

type Stats = {
  tokenizedCount: number;
  settledCount: number;
  totalVolumeUsd: number;
  hcsTopicId: string | null;
  lastTokenized: { tokenId: string; clientName: string; amountUsd: number; agoMs: number } | null;
};

function ago(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

// Real on-chain activity from the live store. Polls every 8s. Renders nothing until
// there's been at least one tokenization (graceful on a fresh/empty store).
export function ActivityWidget() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/stats')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setStats(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Nothing real to show yet — don't render a hollow widget.
  if (!stats || stats.tokenizedCount === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Live on testnet</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric value={stats.tokenizedCount.toString()} label="invoices tokenized" />
        <Metric value={`$${(stats.totalVolumeUsd / 1000).toFixed(0)}k`} label="total volume" />
        <Metric value={stats.settledCount.toString()} label="settled & paid out" />
      </div>

      {stats.lastTokenized && (
        <a
          href={`https://hashscan.io/testnet/token/${stats.lastTokenized.tokenId}`}
          target="_blank"
          rel="noopener"
          className="mt-4 flex items-center justify-between rounded-md bg-surface-2 px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-3"
        >
          <span className="flex items-center gap-2 text-fg-muted">
            <Activity size={14} className="text-brand" />
            Last tokenized: {stats.lastTokenized.clientName} · ${stats.lastTokenized.amountUsd.toLocaleString()}
            <span className="text-fg-subtle">· {ago(stats.lastTokenized.agoMs)}</span>
          </span>
          <ArrowUpRight size={14} className="shrink-0 text-fg-subtle" />
        </a>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-xl font-bold text-fg tnum">{value}</div>
      <div className="text-xs text-fg-subtle">{label}</div>
    </div>
  );
}
