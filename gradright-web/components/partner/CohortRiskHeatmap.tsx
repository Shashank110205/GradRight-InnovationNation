"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type ScatterShapeProps,
} from "recharts";

import {
  NBFC_INSTITUTE_TIERS,
  NBFC_PROGRAM_TYPES,
  riskHeatColor,
} from "@/lib/nbfc/cohort-utils";
import type { NBFCPortfolioData } from "@/lib/types";

type HeatPoint = {
  x: number;
  y: number;
  program_type: string;
  institute_tier: string;
  avg_risk_score: number;
  application_count: number;
  avg_placement_prob_6m: number;
};

function HeatCell(
  props: Readonly<{
    cx?: number;
    cy?: number;
    payload?: HeatPoint;
  }>
) {
  const { cx = 0, cy = 0, payload } = props;
  const w = 52;
  const h = 40;
  const count = payload?.application_count ?? 0;
  const fill =
    count === 0 ? "#e2e8f0" : riskHeatColor(payload?.avg_risk_score ?? 0);
  return (
    <rect
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      rx={6}
      fill={fill}
      fillOpacity={count === 0 ? 0.5 : 0.95}
      stroke="#94a3b8"
      strokeWidth={0.75}
    />
  );
}

function buildPoints(data: NBFCPortfolioData["cohort_heatmap"]): HeatPoint[] {
  const points: HeatPoint[] = [];
  for (let yi = 0; yi < NBFC_INSTITUTE_TIERS.length; yi++) {
    for (let xi = 0; xi < NBFC_PROGRAM_TYPES.length; xi++) {
      const program_type = NBFC_PROGRAM_TYPES[xi];
      const institute_tier = NBFC_INSTITUTE_TIERS[yi];
      const hit = data.find(
        (c) =>
          c.program_type === program_type && c.institute_tier === institute_tier
      );
      points.push({
        x: xi,
        y: NBFC_INSTITUTE_TIERS.length - 1 - yi,
        program_type,
        institute_tier,
        avg_risk_score: hit?.avg_risk_score ?? 0,
        application_count: hit?.application_count ?? 0,
        avg_placement_prob_6m: hit?.avg_placement_prob_6m ?? 0,
      });
    }
  }
  return points;
}

export function CohortRiskHeatmap({
  cohort,
}: {
  cohort: NBFCPortfolioData["cohort_heatmap"];
}) {
  const points = buildPoints(cohort);

  return (
    <div className="h-[380px] w-full rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/50">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 16, right: 16, bottom: 48, left: 72 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.6} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[-0.5, NBFC_PROGRAM_TYPES.length - 0.5]}
            ticks={NBFC_PROGRAM_TYPES.map((_, i) => i)}
            tickFormatter={(i) => NBFC_PROGRAM_TYPES[Number(i)] ?? ""}
            stroke="#64748b"
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, NBFC_INSTITUTE_TIERS.length - 0.5]}
            ticks={NBFC_INSTITUTE_TIERS.map((_, i) => i)}
            tickFormatter={(i) => {
              const idx = NBFC_INSTITUTE_TIERS.length - 1 - Number(i);
              return NBFC_INSTITUTE_TIERS[idx] ?? "";
            }}
            stroke="#64748b"
            width={88}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const p = payload[0].payload as HeatPoint;
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {p.program_type} · {p.institute_tier}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Count: {p.application_count}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Avg score: {p.application_count ? p.avg_risk_score.toFixed(1) : "—"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Avg placement (6m):{" "}
                    {p.application_count
                      ? `${Math.round(p.avg_placement_prob_6m * 100)}%`
                      : "—"}
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            data={points}
            shape={(props: ScatterShapeProps) => (
              <HeatCell
                cx={props.cx}
                cy={props.cy}
                payload={props.payload as HeatPoint | undefined}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center justify-center gap-4 px-2 pb-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded bg-[#22c55e]" /> Strong (66+)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded bg-[#f59e0b]" /> Mid (41–65)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded bg-[#ef4444]" /> Watch (0–40)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-3 rounded bg-[#e2e8f0]" /> Empty cell
        </span>
      </div>
    </div>
  );
}
