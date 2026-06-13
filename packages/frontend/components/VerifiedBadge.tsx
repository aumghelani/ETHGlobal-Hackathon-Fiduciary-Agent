import { Check } from "lucide-react";

export function VerifiedBadge({
  label,
  source,
}: {
  label: string;
  source: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.08] px-3 py-1.5">
      <Check size={14} className="text-brand" />
      <div>
        <div className="text-xs font-medium text-fg">{label}</div>
        <div className="text-[10px] text-fg-subtle">{source}</div>
      </div>
    </div>
  );
}
