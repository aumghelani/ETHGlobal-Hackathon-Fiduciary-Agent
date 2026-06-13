'use client';
import { motion } from 'framer-motion';

// The signature "wait, what?" visual: fee % charged DROPS as agent reputation RISES.
// Pure SVG (no chart lib) — a downward-sloping line with two plotted agents. Animates
// in on scroll. The whole point lands in one glance: trust compresses price.

const W = 520;
const H = 300;
const PAD = { l: 48, r: 24, t: 24, b: 44 };

// Reputation (x, 0-5) → fee% (y) sample curve, decreasing.
const points = [
  { rep: 0, fee: 12 },
  { rep: 1, fee: 7.5 },
  { rep: 2, fee: 4.8 },
  { rep: 3, fee: 3.0 },
  { rep: 4, fee: 1.6 },
  { rep: 5, fee: 0.6 },
];

const maxFee = 13;
const x = (rep: number) => PAD.l + (rep / 5) * (W - PAD.l - PAD.r);
const y = (fee: number) => PAD.t + (1 - fee / maxFee) * (H - PAD.t - PAD.b);

const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.rep)} ${y(p.fee)}`).join(' ');
const areaPath = `${linePath} L ${x(5)} ${H - PAD.b} L ${x(0)} ${H - PAD.b} Z`;

export function InversionChart() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Fee percentage decreases as agent reputation increases">
      <defs>
        <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={PAD.l}
          x2={W - PAD.r}
          y1={PAD.t + t * (H - PAD.t - PAD.b)}
          y2={PAD.t + t * (H - PAD.t - PAD.b)}
          stroke="rgb(var(--line))"
          strokeWidth="1"
        />
      ))}

      {/* axes labels */}
      <text x={PAD.l} y={H - 14} className="fill-[rgb(var(--fg-subtle))] text-[11px]" fontSize="11">
        new agent
      </text>
      <text x={W - PAD.r} y={H - 14} textAnchor="end" className="fill-[rgb(var(--fg-subtle))]" fontSize="11">
        veteran →
      </text>
      <text
        x={14}
        y={PAD.t + 6}
        className="fill-[rgb(var(--fg-subtle))]"
        fontSize="11"
        transform={`rotate(-90 14 ${PAD.t + 6})`}
      >
        higher fee
      </text>

      {/* area + line */}
      <motion.path
        d={areaPath}
        fill="url(#invFill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="rgb(var(--brand))"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />

      {/* the two plotted agents */}
      <Agent rep={0.5} fee={9} label="Newcomer" delay={1.1} tone="muted" />
      <Agent rep={4.8} fee={0.8} label="Veteran" delay={1.3} tone="brand" />
    </svg>
  );
}

function Agent({
  rep,
  fee,
  label,
  delay,
  tone,
}: {
  rep: number;
  fee: number;
  label: string;
  delay: number;
  tone: 'brand' | 'muted';
}) {
  const cx = x(rep);
  const cy = y(fee);
  const color = tone === 'brand' ? 'rgb(var(--brand))' : 'rgb(var(--fg-subtle))';
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <circle cx={cx} cy={cy} r="7" fill={color} />
      <circle cx={cx} cy={cy} r="11" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="2" />
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        className={tone === 'brand' ? 'fill-[rgb(var(--brand))]' : 'fill-[rgb(var(--fg-muted))]'}
      >
        {label} · {fee}%
      </text>
    </motion.g>
  );
}
