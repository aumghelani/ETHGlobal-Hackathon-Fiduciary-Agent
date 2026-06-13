'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Sparkles, TrendingUp, Inbox } from 'lucide-react';
import { Card } from '@/components/ui/card';

type InvoiceListItem = {
  id: string;
  clientName?: string;
  amountUsd: number;
  daysUntilDue: number;
  status?: string;
  acceptedAgentName?: string;
  feePercent?: number | null;
};

// Indicative annualized yield from the agent's fee over the payment horizon — the
// investor's upside is roughly the fee they collect when the client pays. Illustrative.
function indicativeApy(item: InvoiceListItem): number | null {
  if (!item.feePercent || !item.daysUntilDue) return null;
  return (item.feePercent / 100) * (365 / item.daysUntilDue) * 100;
}

export default function InvestPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const fundable = (d.invoices ?? []).filter(
          (inv: any) => inv.acceptedAgentName && inv.status === 'funding'
        );
        setInvoices(fundable);
      })
      .catch(() => setError('Could not load the marketplace. Please refresh.'))
      .finally(() => setLoaded(true));
  }, []);

  const totalOpen = invoices.reduce((s, i) => s + i.amountUsd, 0);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header + stat strip */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg">Invest in invoices</h1>
          <p className="mt-2 max-w-lg text-fg-muted">
            Back a freelancer&apos;s invoice today and earn yield when their client pays.
          </p>
        </div>
        {invoices.length > 0 && (
          <div className="flex gap-3">
            <Stat label="Open invoices" value={`${invoices.length}`} />
            <Stat label="Available to fund" value={`$${totalOpen.toLocaleString()}`} />
          </div>
        )}
      </div>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {/* Loading skeletons */}
      {!loaded && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 rounded-lg border border-line skeleton" />
          ))}
        </div>
      )}

      {/* Empty */}
      {loaded && !error && invoices.length === 0 && (
        <Card className="mt-8 flex flex-col items-center justify-center p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">
            <Inbox size={20} />
          </span>
          <p className="mt-4 font-medium text-fg">No invoices open for funding right now</p>
          <p className="mt-1 text-sm text-fg-muted">Check back soon — new invoices list after each auction.</p>
        </Card>
      )}

      {/* Bento grid */}
      {loaded && invoices.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invoices.map((inv, i) => {
            const apy = indicativeApy(inv);
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link href={`/invest/${inv.id}`} className="block h-full">
                  <Card interactive className="group flex h-full flex-col p-5">
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-medium text-fg-subtle">
                        {inv.clientName ?? 'Client'}
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="text-fg-subtle transition-colors group-hover:text-brand"
                      />
                    </div>

                    <div className="mt-2 font-display text-3xl font-bold tracking-tight text-fg tnum">
                      ${inv.amountUsd.toLocaleString()}
                    </div>
                    <div className="text-xs text-fg-subtle">invoice value</div>

                    {apy !== null && (
                      <div className="mt-4 inline-flex w-fit items-center gap-1 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                        <TrendingUp size={12} />~{apy.toFixed(0)}% APY
                      </div>
                    )}

                    <div className="mt-auto space-y-1.5 pt-4 text-xs text-fg-muted">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-fg-subtle" />
                        Pays in {inv.daysUntilDue} days
                      </div>
                      {inv.acceptedAgentName && (
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-fg-subtle" />
                          {inv.acceptedAgentName}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-4 py-2.5">
      <div className="font-display text-lg font-bold text-fg tnum">{value}</div>
      <div className="text-xs text-fg-subtle">{label}</div>
    </div>
  );
}
