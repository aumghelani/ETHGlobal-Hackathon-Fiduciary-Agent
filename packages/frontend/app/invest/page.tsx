'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type InvoiceListItem = {
  id: string;
  clientName?: string;
  amountUsd: number;
  daysUntilDue: number;
  status?: string;
  acceptedAgentName?: string;
};

export default function InvestPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        // Only show invoices an investor can actually fund: accepted (tokenized + pool
        // deployed) and still in the funding stage.
        const fundable = (d.invoices ?? []).filter(
          (inv: any) => inv.acceptedAgentName && inv.status === 'funding'
        );
        setInvoices(fundable);
      })
      .catch(() => setError('Could not load the marketplace. Please refresh.'))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Invest in invoices</h1>
      <p className="mt-2 text-slate-600">
        Fund a freelancer&apos;s invoice today and earn yield when their client pays.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {loaded && !error && invoices.length === 0 && (
        <p className="mt-8 text-slate-500">
          No invoices are open for funding right now. Check back soon.
        </p>
      )}

      <div className="mt-8 space-y-3">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/invest/${inv.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary"
          >
            <div>
              <div className="font-medium text-slate-900">
                {inv.clientName ?? 'Invoice'} · ${inv.amountUsd.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Payment expected in {inv.daysUntilDue} days
                {inv.acceptedAgentName ? ` · managed by ${inv.acceptedAgentName}` : ''}
              </div>
            </div>
            <ArrowRight size={18} className="shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
