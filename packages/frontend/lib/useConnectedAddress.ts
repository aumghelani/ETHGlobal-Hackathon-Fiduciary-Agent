'use client';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { DYNAMIC_ENABLED } from '@/components/DynamicProvider';

// The connected wallet address (lower-cased), or null when no wallet / Dynamic disabled.
// Used to tag invoices + investments to "me" so the dashboard can highlight my own records.
// Safe to call even when Dynamic is off — the provider still renders a context, and we
// simply get an empty wallet.
export function useConnectedAddress(): string | null {
  // DYNAMIC_ENABLED is a module constant (derived from an env var at build time), so it is
  // stable across every render — the conditional hook call below never changes between
  // renders, which keeps the Rules of Hooks satisfied. When Dynamic is disabled its provider
  // isn't mounted, so we must NOT call useDynamicContext (it would throw).
  if (!DYNAMIC_ENABLED) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { primaryWallet } = useDynamicContext();
  return primaryWallet?.address ? primaryWallet.address.toLowerCase() : null;
}
