'use client';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/components/providers';
import { currencySymbol, toUsd, type Currency } from '@/lib/currency';

// Face value in the invoice's own currency (USD by default — the fintech story). When the
// currency isn't USD, Pro mode reveals the USD-equivalent the settlement uses. In Pro mode
// it can also show the on-chain USDC figure. Tabular numerals keep figures aligned.
export function Money({
  usd,
  usdc,
  currency = 'USD',
  className,
  maxFractionDigits = 2,
}: {
  usd: number;
  usdc?: number | string;
  currency?: Currency;
  className?: string;
  maxFractionDigits?: number;
}) {
  const { proMode } = useUI();
  const sym = currencySymbol(currency);
  const nonUsd = currency !== 'USD';
  return (
    <span className={'tnum ' + (className ?? '')}>
      {sym}
      {usd.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits })}
      {proMode && nonUsd && (
        <span className="ml-1 text-fg-subtle">
          ≈ ${toUsd(usd, currency).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      )}
      {proMode && usdc !== undefined && (
        <span className="ml-1 text-fg-subtle">· {usdc} USDC</span>
      )}
    </span>
  );
}

// A number that animates to its target value (kinetic transition for funding fills,
// reputation climbs, payout reveals). Respects reduced-motion via a quick path.
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  durationMs = 700,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return (
    <span className={'tnum ' + (className ?? '')}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
