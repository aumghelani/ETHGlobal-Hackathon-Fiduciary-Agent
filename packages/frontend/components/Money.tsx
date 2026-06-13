'use client';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/components/providers';

// Dollars by default (the fintech story). In Pro mode, optionally reveal the on-chain
// USDC figure alongside. Tabular numerals keep figures aligned.
export function Money({
  usd,
  usdc,
  className,
  maxFractionDigits = 2,
}: {
  usd: number;
  usdc?: number | string;
  className?: string;
  maxFractionDigits?: number;
}) {
  const { proMode } = useUI();
  return (
    <span className={'tnum ' + (className ?? '')}>
      ${usd.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits })}
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
