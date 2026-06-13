// Subtle footer-style attribution to the winning agent's Circle-managed wallet on Arc
// (the autonomous fiduciary agent's account). Like HcsAuditLink, this is the kind of
// small blockchain attribution allowed in user-facing copy (UX rule). Renders nothing
// if Circle wasn't configured (no agent wallet).
export function AgentWalletLink({
  address,
  className,
}: {
  address: string | null | undefined;
  className?: string;
}) {
  if (!address) return null;
  return (
    <p className={className ?? 'mt-2 text-center text-xs text-slate-400'}>
      <a
        href={`https://testnet.arcscan.app/address/${address}`}
        target="_blank"
        rel="noopener"
        className="underline hover:text-slate-600"
      >
        Agent wallet on Arc ↗
      </a>
    </p>
  );
}
