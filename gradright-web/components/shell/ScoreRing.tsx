"use client";

import { useId, useLayoutEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { CountUp } from "./CountUp";

const R = 52;
const STROKE = 8;
const C = 2 * Math.PI * R;

export function ScoreRing({
  value,
  label,
  sublabel,
  className,
}: {
  value: number;
  label: string;
  sublabel?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const offset = useMemo(() => C - (pct / 100) * C, [pct]);
  const [strokeOff, setStrokeOff] = useState(C);
  const gradId = `srg-${useId().replace(/:/g, "")}`;

  useLayoutEffect(() => {
    setStrokeOff(offset);
  }, [offset]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative grid place-items-center">
        <svg
          width={140}
          height={140}
          viewBox="0 0 120 120"
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-muted/35"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            stroke={`url(#${gradId})`}
            style={{
              strokeDasharray: C,
              strokeDashoffset: strokeOff,
              transition: "stroke-dashoffset 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="55%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground">
            <CountUp to={pct} duration={1.1} />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
      </div>
      {sublabel ? (
        <p className="max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
