import { Star, CheckCircle, MessageSquare, Loader2 } from "lucide-react";
import type { Bid } from "@fiduciary/agents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BidCard({
  agentName,
  reputationScore,
  completedDeals,
  bid,
  highlight = false,
  tokenizing = false,
  disabled = false,
  onAccept,
}: {
  agentName: string;
  reputationScore: number;
  completedDeals: number;
  bid: Bid | null;
  highlight?: boolean;
  tokenizing?: boolean;
  disabled?: boolean;
  onAccept: () => void;
}) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-6",
        highlight ? "ring-2 ring-emerald-500 border-emerald-200" : "border-slate-200"
      )}
    >
      {highlight && (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
          <CheckCircle size={12} /> Best offer
        </span>
      )}

      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">{agentName}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          <Star size={12} className="text-amber-500" />
          {reputationScore} · {completedDeals} deals
        </span>
      </div>

      {bid === null ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="mt-3 text-sm text-slate-500">Analyzing invoice...</p>
        </div>
      ) : (
        <div className="bid-reveal mt-4">
          <div className="text-4xl font-bold text-slate-900">
            ${bid.netToFreelancer.toLocaleString()}
          </div>
          <p className="text-sm text-slate-500">You receive in your bank account</p>

          <div className="mt-4 space-y-1 text-sm text-slate-500">
            <div>Discount: {bid.discountPercent}%</div>
            <div>Agent fee: {bid.feePercent}%</div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm italic text-slate-600">
            <MessageSquare size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <p>{bid.reasoning}</p>
          </div>

          {tokenizing ? (
            <Button className="mt-6 w-full" variant={highlight ? "default" : "outline"} disabled>
              <Loader2 className="mr-2 animate-spin" size={16} />
              Securing your offer...
            </Button>
          ) : (
            <Button
              className="mt-6 w-full"
              variant={highlight ? "default" : "outline"}
              disabled={disabled}
              onClick={onAccept}
            >
              Accept this offer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
