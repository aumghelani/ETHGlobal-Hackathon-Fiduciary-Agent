// Small footer-style attribution link to an invoice's HCS audit-log entry
// (THREAT_MODEL Layer 3). The ONLY blockchain reference allowed in user-facing copy
// is this subtle attestation link (UX rule). Renders nothing if the hash wasn't
// committed (submit failed) or the topic id is unknown.
//
// Links to the TOPIC on HashScan (the topic page lists all messages, including ours).
// HashScan is a client-side SPA, so a per-message deep link couldn't be reliably
// verified to render — the topic URL is known-good. The sequence number is shown in
// the link text so the viewer knows which entry to look for.
export function HcsAuditLink({
  seq,
  topicId,
  className,
}: {
  seq: number | null | undefined;
  topicId: string | null | undefined;
  className?: string;
}) {
  if (seq === null || seq === undefined || !topicId) return null;
  const href = `https://hashscan.io/testnet/topic/${topicId}`;
  return (
    <p className={className ?? 'mt-6 text-center text-xs text-slate-400'}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="underline hover:text-slate-600"
      >
        Audit log on Hedera (entry #{seq}) ↗
      </a>
    </p>
  );
}
