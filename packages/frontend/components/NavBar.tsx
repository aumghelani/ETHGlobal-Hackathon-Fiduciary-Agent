'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useUI } from '@/components/providers';
import { DYNAMIC_ENABLED } from '@/components/DynamicProvider';
import { WalletButton } from '@/components/WalletButton';

const LINKS = [
  { href: '/upload', label: 'Get funded' },
  { href: '/invest', label: 'Invest' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function NavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme, proMode, toggleProMode } = useUI();

  return (
    <nav className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-fg">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-on-brand">C</span>
          cashmeifyoucan
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="mr-1 hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg')
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Dynamic login/connect — only when configured. */}
          {DYNAMIC_ENABLED && <WalletButton />}

          {/* Dev mode reveals the on-chain layer (USDC, tx hashes, explorer links) everywhere. */}
          <button
            onClick={toggleProMode}
            aria-pressed={proMode}
            title="Dev mode: reveal on-chain details"
            className={
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ' +
              (proMode
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line text-fg-subtle hover:text-fg-muted')
            }
          >
            <Sparkles size={13} />
            Dev
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle light / dark"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-fg-muted transition-colors hover:text-fg"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
