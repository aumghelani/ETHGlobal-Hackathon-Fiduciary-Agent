'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDKitWidget, VerificationLevel, type ISuccessResult } from "@worldcoin/idkit";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { hashFile } from "@/lib/hash";

// World ID config comes from the public env (the widget runs in the browser). When the
// App ID is absent we degrade gracefully — the gate is bypassed with a visible note.
const WLD_APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}` | undefined;
const WLD_ACTION = process.env.NEXT_PUBLIC_WLD_ACTION ?? "factor-invoice";
const WORLD_ID_ENABLED = !!WLD_APP_ID;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [daysUntilDue, setDaysUntilDue] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // The verified World ID proof (null until the user completes verification). When
  // World ID is disabled (no App ID), this stays null and the gate is bypassed.
  const [worldIdProof, setWorldIdProof] = useState<ISuccessResult | null>(null);

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
    if (WORLD_ID_ENABLED && !worldIdProof) {
      setError("Please verify you're a real person first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await hashFile(file);
      console.log("Invoice hash:", hash);

      // Map IDKit's snake_case proof to the API's camelCase shape (lib/worldid.ts).
      const proofPayload = worldIdProof
        ? {
            proof: worldIdProof.proof,
            nullifierHash: worldIdProof.nullifier_hash,
            merkleRoot: worldIdProof.merkle_root,
            verificationLevel: worldIdProof.verification_level,
            action: WLD_ACTION,
          }
        : undefined;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          amountUsd: amount,
          daysUntilDue: days,
          invoiceHash: hash,
          worldIdProof: proofPayload,
        }),
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

        {/* World ID human-verification step. Shown only when an App ID is configured;
            otherwise we degrade gracefully with a subtle note (demo never breaks). */}
        {WORLD_ID_ENABLED ? (
          worldIdProof ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Verified as a real person
            </div>
          ) : (
            <IDKitWidget
              app_id={WLD_APP_ID!}
              action={WLD_ACTION}
              verification_level={VerificationLevel.Device}
              onSuccess={(proof: ISuccessResult) => setWorldIdProof(proof)}
            >
              {({ open }: { open: () => void }) => (
                <Button type="button" variant="outline" size="lg" className="w-full" onClick={open}>
                  Verify you&apos;re a real person
                </Button>
              )}
            </IDKitWidget>
          )
        ) : (
          <p className="text-center text-xs text-slate-400">
            Identity verification runs in production.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || (WORLD_ID_ENABLED && !worldIdProof)}
        >
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
