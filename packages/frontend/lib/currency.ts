// Multi-currency DISPLAY (denomination only). An invoice can be denominated in a few
// currencies for the UI; settlement stays in USDC on-chain. We keep a static demo rate to
// USD so the symbol + figure are consistent; a real deployment would pull live FX. The
// invoice's stored amount is its FACE VALUE in its own currency — we convert to a USD-
// equivalent for the USDC settlement math only.

export type Currency = 'USD' | 'EUR' | 'GBP';

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
];

// Static demo FX → USD (1 unit of currency = X USD). Illustrative, not live.
const RATE_TO_USD: Record<Currency, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
};

export function currencySymbol(c: Currency | undefined | null): string {
  return CURRENCIES.find((x) => x.code === c)?.symbol ?? '$';
}

export function isCurrency(v: unknown): v is Currency {
  return v === 'USD' || v === 'EUR' || v === 'GBP';
}

// Format a face-value amount in its own currency for display.
export function formatAmount(amount: number, c: Currency | undefined | null, maxFractionDigits = 2): string {
  return `${currencySymbol(c)}${amount.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits })}`;
}

// Convert a face-value amount in `c` to its USD equivalent (drives the USDC settlement math).
export function toUsd(amount: number, c: Currency | undefined | null): number {
  return amount * (RATE_TO_USD[(c as Currency) ?? 'USD'] ?? 1);
}
