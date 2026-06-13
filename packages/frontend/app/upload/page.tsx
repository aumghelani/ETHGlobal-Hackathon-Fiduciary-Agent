'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { hashFile } from "@/lib/hash";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [daysUntilDue, setDaysUntilDue] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amount = Number(amountUsd);
    const days = Number(daysUntilDue);
    if (!file) {
      setError("Please upload your invoice.");
      return;
    }
    if (!clientName.trim()) {
      setError("Please enter the client name.");
      return;
    }
    if (!(amount > 0)) {
      setError("Amount due must be greater than zero.");
      return;
    }
    if (!(days > 0)) {
      setError("Days until payment must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await hashFile(file);
      console.log("Invoice hash:", hash);

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, amountUsd: amount, daysUntilDue: days }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }
      const { id } = await res.json();
      router.push(`/auction/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-slate-900">Get cash today</h1>
      <p className="mt-2 text-slate-600">
        Sell your unpaid invoice. We&apos;ll have offers in 30 seconds.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <VerifiedBadge label="Identity verified" source="World ID" />
        <VerifiedBadge label="Domain verified" source="DKIM proof" />
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="file">Upload invoice PDF or photo</Label>
          <Input
            id="file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Client name</Label>
          <Input
            id="clientName"
            type="text"
            placeholder="BigCorp"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountUsd">Amount due</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <Input
              id="amountUsd"
              type="number"
              placeholder="5000"
              className="pl-7"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysUntilDue">Days until payment</Label>
          <div className="relative">
            <Input
              id="daysUntilDue"
              type="number"
              className="pr-14"
              value={daysUntilDue}
              onChange={(e) => setDaysUntilDue(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              days
            </span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Finding offers..." : "Get offers"}
        </Button>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <p className="text-center text-xs text-slate-400">
          Trusted by 70M+ freelancers
        </p>
      </form>
    </div>
  );
}
