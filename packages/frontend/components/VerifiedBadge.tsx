import { Check } from "lucide-react";

export function VerifiedBadge({
  label,
  source,
}: {
  label: string;
  source: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200">
      <Check size={14} className="text-emerald-600" />
      <div>
        <div className="text-xs font-medium text-emerald-900">{label}</div>
        <div className="text-[10px] text-emerald-700/70">{source}</div>
      </div>
    </div>
  );
}
