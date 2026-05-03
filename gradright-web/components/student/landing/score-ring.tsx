"use client";

import { motion } from "framer-motion";

export function ScoreRing({
  value,
  label,
  sublabel,
}: {
  value: number;
  label: string;
  sublabel: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative flex flex-col items-center py-2">
      <div className="relative size-36">
        <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted-foreground/35"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="url(#gr-score-ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            initial={{ strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${dash} ${c}` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="gr-score-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl font-bold tabular-nums tracking-tight">
            {value}
          </span>
        </div>
      </div>
      <p className="mt-1 text-center font-heading text-sm font-semibold">{label}</p>
      <p className="text-center text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}
