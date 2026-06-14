'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, ArrowUpRight, Inbox, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useConnectedAddress } from '@/lib/useConnectedAddress';

// A portfolio dashboard derived from the live store. Shows ALL platform activity, and
// highlights the rows tied to YOUR connected wallet (invoices you created, invoices you
// funded) so it reads as a personal history layered over the market view.

type Investment = { address: string | null; amountUsd: number | null; private: boolean; at: string };
type Invoice = {
  id: string;
  clientName?: string;
  amountUsd: number;
  daysUntilDue: number;
  status?: string;
  acceptedAgentName?: string;
  feePercent?: number | null;
  agentEarnings?: number | null;
  netToFreelancer?: number | null;
  createdByAddress?: string | null;
  investments?: Investment[];
};

type Role = 'freelancer' | 'investor';

function apy(i: Invoice): number | null {
  if (!i.feePercent || !i.daysUntilDue) return null;
  return (i.feePercent / 100) * (365 / i.daysUntilDue) * 100;
}

export default function DashboardPage() {
  const me = useConnectedAddress();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState<Role>('freelancer');

  // Pass the connected wallet as ?me so the API reveals MY private investment amounts to me
  // (and only me). Re-fetch when the wallet connects/changes.
  useEffect(() => {
    const url = me ? `/api/invoices?me=${encodeURIComponent(me)}` : '/api/invoices';
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setInvoices(d.invoices ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [me]);

  // Is this invoice tied to MY connected wallet (created it, or funded it)?
  const isMine = (i: Invoice): boolean => {
    if (!me) return false;
    if (i.createdByAddress === me) return true;
    return (i.investments ?? []).some((iv) => iv.address === me);
  };
  // What I received back as an investor when this invoice settled (my proportional share of
  // the investor payout). Includes my private deposits too — their amount is revealed to ME
  // (the owner) by the API, so I can total my own stake whether public or private.
  const myReceived = (i: Invoice): number => {
    if (!me || i.status !== 'settled') return 0;
    const mine = (i.investments ?? []).filter((iv) => iv.address === me);
    const myStake = mine.reduce((s, iv) => s + (iv.amountUsd ?? 0), 0);
    if (myStake <= 0) return 0;
    // Investors split (amount - agent fee) proportionally to their stake in the net pool.
    const investorPool = i.amountUsd - (i.agentEarnings ?? 0);
    const net = i.netToFreelancer ?? i.amountUsd; // funding is denominated against net-to-freelancer
    return net > 0 ? Math.round((myStake / net) * investorPool * 100) / 100 : 0;
  };

  // Freelancer view: every invoice that has been listed/accepted (the supply side).
  // Investor view: invoices open for funding or already settled (the capital side).
  const freelancerInvoices = invoices.filter((i) => i.acceptedAgentName || i.status === 'pending_auction');
  const investorInvoices = invoices.filter(
    (i) => i.acceptedAgentName && (i.status === 'funding' || i.status === 'settled')
  );
  let rows = role === 'freelancer' ? freelancerInvoices : investorInvoices;
  // Sort my own records to the top so my history is front and center.
  rows = [...rows].sort((a, b) => (isMine(b) ? 1 : 0) - (isMine(a) ? 1 : 0));

  const settled = invoices.filter((i) => i.status === 'settled');
  const funding = invoices.filter((i) => i.status === 'funding');
  const totalVolume = invoices.filter((i) => i.acceptedAgentName).reduce((s, i) => s + i.amountUsd, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg">Dashboard</h1>
          <p className="mt-2 text-fg-muted">A live view of activity across the platform.</p>
        </div>
        {/* Role toggle */}
        <div className="inline-flex rounded-md border border-line bg-surface p-1">
          {(['freelancer', 'investor'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={
                'rounded-sm px-4 py-1.5 text-sm font-medium capitalize transition-colors ' +
                (role === r ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg-muted')
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {role === 'freelancer' ? (
          <>
            <Kpi icon={Briefcase} label="Invoices listed" value={`${freelancerInvoices.length}`} />
            <Kpi icon={TrendingUp} label="Total advanced" value={`$${totalVolume.toLocaleString()}`} />
            <Kpi icon={Inbox} label="Settled" value={`${settled.length}`} />
          </>
        ) : (
          <>
            <Kpi icon={Briefcase} label="Open to fund" value={`${funding.length}`} />
            <Kpi icon={TrendingUp} label="Volume on platform" value={`$${totalVolume.toLocaleString()}`} />
            <Kpi icon={Inbox} label="Paid out" value={`${settled.length}`} />
          </>
        )}
      </div>

      {/* Table */}
      <div className="mt-8">
        {!loaded ? (
          <div className="h-40 rounded-lg border border-line skeleton" />
        ) : rows.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">
              <Inbox size={20} />
            </span>
            <p className="mt-4 font-medium text-fg">Nothing here yet</p>
            <p className="mt-1 text-sm text-fg-muted">
              {role === 'freelancer' ? 'Upload an invoice to get started.' : 'No invoices open for funding right now.'}
            </p>
            <Link
              href={role === 'freelancer' ? '/upload' : '/invest'}
              className="mt-4 text-sm font-semibold text-brand hover:underline"
            >
              {role === 'freelancer' ? 'Get funded →' : 'Browse invoices →'}
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs text-fg-muted">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">{role === 'freelancer' ? 'Agent' : 'Yield'}</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((i, idx) => {
                  const mine = isMine(i);
                  const received = role === 'investor' ? myReceived(i) : 0;
                  return (
                  <motion.tr
                    key={i.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={mine ? 'bg-brand/[0.05]' : undefined}
                  >
                    <td className="px-4 py-3 font-medium text-fg">
                      <span className="inline-flex items-center gap-2">
                        {i.clientName ?? 'Client'}
                        {mine && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            <User size={10} /> You
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 tnum text-fg">${i.amountUsd.toLocaleString()}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {role === 'freelancer'
                        ? (i.acceptedAgentName ?? '-')
                        : received > 0
                          ? <span className="font-semibold text-brand tnum">+${received.toLocaleString()} received</span>
                          : apy(i) !== null
                            ? `~${apy(i)!.toFixed(0)}% APY`
                            : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/invest/${i.id}`} className="text-fg-subtle hover:text-brand">
                        <ArrowUpRight size={15} className="inline" />
                      </Link>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/12 text-brand">
        <Icon size={16} />
      </span>
      <div className="mt-3 font-display text-2xl font-bold text-fg tnum">{value}</div>
      <div className="text-xs text-fg-subtle">{label}</div>
    </Card>
  );
}

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_auction: { label: 'In auction', cls: 'bg-accent/10 text-accent' },
    funding: { label: 'Funding', cls: 'bg-warn/10 text-warn' },
    settled: { label: 'Settled', cls: 'bg-brand/10 text-brand' },
  };
  const s = map[status ?? ''] ?? { label: status ?? 'pending', cls: 'bg-surface-3 text-fg-muted' };
  return <span className={'rounded-md px-2 py-0.5 text-xs font-medium ' + s.cls}>{s.label}</span>;
}
