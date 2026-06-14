// Days remaining until an invoice is due, counted from when it was created. daysUntilDue is
// the ORIGINAL term (set at upload, used for APY over the full term); this counts DOWN from
// it so the UI shows a live "pays in N days" instead of a frozen number. Never goes below 0.
export function dueInDays(createdAt: string | undefined, daysUntilDue: number): number {
  if (!createdAt) return daysUntilDue;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return daysUntilDue;
  const elapsedDays = Math.floor((Date.now() - created) / 86_400_000);
  return Math.max(0, daysUntilDue - elapsedDays);
}
