'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import type { Bid } from '@fiduciary/agents';

export default function InvestInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<any | null>(null);
  const [netToFreelancer, setNetToFreelancer] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const { invoice } = await res.json();
      if (cancelled) return;
      setInvoice(invoice);

      if (invoice?.acceptedAgentName) {
        const bidsRes = await fetch(`/api/auctions/${invoiceId}/start`, { method: 'POST' });
        if (bidsRes.ok) {
          const { bids } = await bidsRes.json();
          const accepted = (bids as Bid[]).find(
            (b) => b.agentName === invoice.acceptedAgentName
          );
          if (!cancelled && accepted) setNetToFreelancer(accepted.netToFreelancer);
        }
      }
      if (!cancelled) setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [invoiceId]);

  if (loaded && (!invoice || !invoice.tokenId)) {
    return <p className="text-slate-600">This invoice hasn&apos;t been tokenized yet.</p>;
  }

  if (!invoice) {
    return null;
  }

  const hashscanUrl = `https://hashscan.io/testnet/token/${invoice.tokenId}`;

  return (
    <div className="mx-auto max-w-md text-center">
      <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Your offer is secured</h1>
      {netToFreelancer !== null && (
        <p className="mt-2 text-slate-600">
          ${netToFreelancer.toLocaleString()} will arrive in your bank account within 24 hours
        </p>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 p-4 text-left text-sm text-slate-700">
        <div>Client: {invoice.clientName}</div>
        <div>Amount: ${invoice.amountUsd.toLocaleString()}</div>
        <div>Payment expected: {invoice.daysUntilDue} days</div>
        {netToFreelancer !== null && (
          <div>Your net: ${netToFreelancer.toLocaleString()}</div>
        )}
      </div>

      <a
        href={hashscanUrl}
        target="_blank"
        rel="noopener"
        className="mt-8 inline-block text-xs text-slate-400 hover:text-slate-600"
      >
        Verification on Hedera ↗
      </a>
    </div>
  );
}
