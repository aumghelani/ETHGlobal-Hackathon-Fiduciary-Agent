'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IDKitRequestWidget, proofOfHuman, type IDKitResult, type RpContext } from "@worldcoin/idkit";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { hashFile } from "@/lib/hash";
import { CURRENCIES, currencySymbol, type Currency } from "@/lib/currency";

// World ID 4.0 config. The App ID is public (browser). The rp_context (with the secret
// signature) is fetched from /api/worldid/context at verify time — never exposed here.
// When the App ID is absent we degrade gracefully (gate bypassed with a visible note).
const WLD_APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}` | undefined;
const WLD_ACTION = process.env.NEXT_PUBLIC_WLD_ACTION ?? "factor-invoice";
// IDKit defaults `environment` to "production" (NOT inferred from the app_id prefix), which
// makes the World ID simulator reject the request ("Production request detected"). For
// simulator testing this must be "staging". The app_id needs no special prefix in v4 — this
// flag is the only thing that selects staging vs production. Default to staging for dev.
const WLD_ENV = (process.env.NEXT_PUBLIC_WLD_ENV ?? "staging") as "production" | "staging";
// Demo escape hatch (default OFF): when true, skip the World ID step so the full flow
// can be demoed without a real World ID account. Must mirror the server's DEMO_BYPASS_WORLDID.
const DEMO_BYPASS = process.env.NEXT_PUBLIC_DEMO_BYPASS_WORLDID === "true";
const WORLD_ID_ENABLED = !!WLD_APP_ID && !DEMO_BYPASS;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [daysUntilDue, setDaysUntilDue] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Distinct from a generic error: set when the upload is rejected as a duplicate
  // (HCS double-spend defense, 409). Rendered as a prominent "already factored" card.
  const [duplicate, setDuplicate] = useState(false);
  // The verified World ID v4 result (null until verification completes). Degrades to
  // null when World ID is disabled (gate bypassed).
  const [worldIdResult, setWorldIdResult] = useState<IDKitResult | null>(null);
  // v4 widget control + the server-signed rp_context it needs.
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [preparing, setPreparing] = useState(false);
  // Demo-only: status text for the "reset uniqueness" control (clears the one-per-human
  // gate so the same human can re-verify on stage). Token-guarded server-side.
  const [resetMsg, setResetMsg] = useState("");
  const [resetting, setResetting] = useState(false);

  // Clear the World ID nullifier gate. Prompts for the secret token so a clicking visitor
  // can't silently defeat Sybil resistance — only someone with the passphrase can reset.
  async function handleReset() {
    const token = window.prompt("Enter the demo reset passphrase:");
    if (!token) return;
    setResetMsg("");
    setResetting(true);
    try {
      const res = await fetch("/api/dev/reset-nullifiers", {
        method: "POST",
        headers: { "x-dev-reset-token": token },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResetMsg(`Reset done. Cleared ${data.clearedNullifiers ?? 0}. You can verify again.`);
        setWorldIdResult(null);
        setError("");
      } else {
        setResetMsg(data.error ?? "Reset failed.");
      }
    } catch {
      setResetMsg("Reset failed. Try again.");
    } finally {
      setResetting(false);
    }
  }

  // Fetch a fresh server-signed rp_context, then open the widget. Keeps the signing
  // key server-side (the route signs; we only receive the public context).
  async function startVerification() {
    setError("");
    setPreparing(true);
    try {
      const res = await fetch("/api/worldid/context");
      if (!res.ok) {
        setError("Verification is unavailable right now. Please try again.");
        return;
      }
      const { rp_context } = await res.json();
      setRpContext(rp_context as RpContext);
      setWidgetOpen(true);
    } catch {
      setError("Verification is unavailable right now. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDuplicate(false);

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
    if (WORLD_ID_ENABLED && !worldIdResult) {
      setError("Please verify you're a real person first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await hashFile(file);
      console.log("Invoice hash:", hash);

      // v4: forward the IDKit result payload AS-IS — the backend relays it to the
      // Developer Portal verify endpoint without remapping.
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          amountUsd: amount,
          currency,
          daysUntilDue: days,
          invoiceHash: hash,
          worldIdResult: worldIdResult ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 409 = HCS double-spend defense fired (this invoice hash is already on the
        // audit log). Show the distinct "already factored" card, not a generic error.
        if (res.status === 409) {
          setDuplicate(true);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
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
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg">Get cash today</h1>
      <p className="mt-2 text-fg-muted">
        Upload your unpaid invoice and agents will have offers in seconds.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <VerifiedBadge label="Identity verified" source="World ID" />
        <VerifiedBadge label="Domain verified" source="DKIM proof" />
        {/* Demo-only: reset the one-per-human gate so the same verified human can run the
            flow again on stage. Token-guarded (prompts for a passphrase), so a visitor can't
            silently defeat Sybil resistance. Hidden unless explicitly enabled. */}
        {process.env.NEXT_PUBLIC_SHOW_RESET === "true" && (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-fg-subtle transition-colors hover:text-fg-muted disabled:opacity-50"
            title="Demo only: clear the one-per-human gate (passphrase required)"
          >
            {resetting ? "Resetting…" : "Reset verification (demo)"}
          </button>
        )}
      </div>
      {resetMsg && <p className="mt-2 text-xs text-fg-subtle">{resetMsg}</p>}

      <form className="mt-7 space-y-5 rounded-lg border border-line bg-surface p-6 shadow-sm" onSubmit={handleSubmit}>
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
                {currencySymbol(currency)}
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
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-fg focus-visible:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
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
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
              days
            </span>
          </div>
        </div>

        {/* World ID 4.0 human-verification step. Shown only when an App ID is configured;
            otherwise we degrade gracefully with a subtle note (demo never breaks). */}
        {WORLD_ID_ENABLED ? (
          worldIdResult ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-brand/30 bg-brand/[0.08] p-3 text-sm font-medium text-fg">
              <CheckCircle2 size={16} className="text-brand" />
              Verified as a real person
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={startVerification}
                disabled={preparing}
              >
                {preparing ? "Preparing…" : "Verify you're a real person"}
              </Button>
              {rpContext && (
                <IDKitRequestWidget
                  open={widgetOpen}
                  onOpenChange={setWidgetOpen}
                  app_id={WLD_APP_ID!}
                  action={WLD_ACTION}
                  environment={WLD_ENV}
                  rp_context={rpContext}
                  allow_legacy_proofs={true}
                  preset={proofOfHuman()}
                  onSuccess={(result: IDKitResult) => {
                    setWorldIdResult(result);
                    setWidgetOpen(false);
                  }}
                  onError={(err: unknown) => {
                    // Surface World's real failure reason instead of a generic message —
                    // the IDKit error carries a code/detail (e.g. invalid_signature,
                    // verification_rejected) that pinpoints why the proof was refused.
                    console.error('[worldid] IDKit onError:', err);
                    const e = err as { code?: string; detail?: string; message?: string };
                    setError(
                      `World ID error: ${e?.code ?? 'unknown'}${e?.detail ? ` — ${e.detail}` : e?.message ? ` — ${e.message}` : ''}`
                    );
                    setWidgetOpen(false);
                  }}
                />
              )}
            </>
          )
        ) : DEMO_BYPASS && WLD_APP_ID ? (
          <p className="text-center text-xs text-warn">
            Demo mode: World ID verification bypassed.
          </p>
        ) : (
          <p className="text-center text-xs text-fg-subtle">
            Identity verification runs in production.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || (WORLD_ID_ENABLED && !worldIdResult)}
        >
          {isSubmitting ? "Finding offers..." : "Get offers"}
        </Button>

        {error && <p className="text-center text-sm text-danger">{error}</p>}

        {duplicate && (
          <div className="flex items-start gap-3 rounded-md border border-warn/40 bg-warn/[0.1] p-4 text-sm text-fg">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" />
            <div>
              <p className="font-semibold">This invoice has already been factored.</p>
              <p className="mt-1 text-fg-muted">
                Our audit log shows this exact invoice was already submitted, so it can&apos;t be sold twice.
                Upload a different invoice to continue.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-fg-subtle">Trusted by 70M+ freelancers</p>
      </form>
    </div>
  );
}
