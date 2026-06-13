'use client';
import { useParams } from 'next/navigation';

export default function AuctionPage() {
  const params = useParams();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">Auction in progress</h1>
      <p className="mt-2 text-slate-600">Invoice ID: {params.id}</p>
      <p className="mt-8 text-slate-500">Live agent auction goes here (next prompt).</p>
    </div>
  );
}
