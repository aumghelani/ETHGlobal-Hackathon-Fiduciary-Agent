'use client';

// A quiet "Built with" strip of the sponsor tech we actually use. Official brand SVGs
// aren't bundled, so each is a small hand-built glyph + wordmark in a neutral chip —
// recognizable without misrepresenting any brand's exact logo. Grayscale by default,
// color on hover, so it reads as a credibility row and not a banner.

type Sponsor = {
  name: string;
  role: string;
  glyph: React.ReactNode;
};

const SPONSORS: Sponsor[] = [
  {
    name: 'Hedera',
    role: 'Tokens, audit log, scheduled payouts',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M20 2C10.06 2 2 10.06 2 20s8.06 18 18 18 18-8.06 18-18S29.94 2 20 2zm8 26h-3v-5H15v5h-3V12h3v5h10v-5h3v16z" />
      </svg>
    ),
  },
  {
    name: 'Arc',
    role: 'Programmable USDC settlement',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden>
        <path d="M6 30a14 14 0 0 1 28 0" strokeLinecap="round" />
        <circle cx="20" cy="30" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Circle',
    role: 'USDC and agent wallets',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden>
        <circle cx="20" cy="20" r="14" />
      </svg>
    ),
  },
  {
    name: 'Unlink',
    role: 'Private deposits and payouts',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.2" aria-hidden>
        <rect x="9" y="18" width="22" height="14" rx="3" />
        <path d="M14 18v-3a6 6 0 0 1 11-3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'World ID',
    role: 'Proof of personhood',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
        <circle cx="20" cy="20" r="15" />
        <path d="M5 20h30M20 5c5 4 5 26 0 30M20 5c-5 4-5 26 0 30" />
      </svg>
    ),
  },
  {
    name: 'Dynamic',
    role: 'Login and embedded wallets',
    glyph: (
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M20 4l14 8v16l-14 8L6 28V12L20 4zm0 5L11 14v12l9 5 9-5V14l-9-5z" />
      </svg>
    ),
  },
];

export function SponsorStrip() {
  return (
    <div className="rounded-lg border border-line bg-surface/50 px-5 py-5">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
        Built with
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {SPONSORS.map((s) => (
          <div
            key={s.name}
            title={s.role}
            className="group flex items-center gap-2 rounded-md border border-line/70 bg-surface px-3 py-2 text-fg-subtle transition-colors hover:border-brand/40 hover:text-brand"
          >
            <span className="text-fg-muted transition-colors group-hover:text-brand">{s.glyph}</span>
            <span className="text-sm font-semibold text-fg-muted transition-colors group-hover:text-fg">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
