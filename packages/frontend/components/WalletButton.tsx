'use client';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Wallet, LogOut } from 'lucide-react';

// Login/connect button driven by Dynamic. Only mounted when Dynamic is enabled (the
// navbar guards on DYNAMIC_ENABLED), so useDynamicContext is always inside the provider.
// Abstracted by default — shows a short address chip when connected; the wallet/connector
// detail lives behind Pro mode elsewhere.
export function WalletButton() {
  const { primaryWallet, user, setShowAuthFlow, handleLogOut } = useDynamicContext();

  if (!primaryWallet && !user) {
    return (
      <button
        onClick={() => setShowAuthFlow(true)}
        className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
      >
        <Wallet size={13} />
        Sign in
      </button>
    );
  }

  const addr = primaryWallet?.address;
  const short = addr ? `${addr.slice(0, 5)}…${addr.slice(-4)}` : (user?.email ?? 'Account');

  return (
    <div className="flex items-center gap-1">
      <span className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-fg-muted">
        {short}
      </span>
      <button
        onClick={() => handleLogOut()}
        aria-label="Sign out"
        title="Sign out"
        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-fg-subtle transition-colors hover:text-fg"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
