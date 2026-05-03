import type { RiskScore } from "@/lib/types";
import { formatSalaryBand } from "@/lib/utils/calculations";

export function SalaryBandDisplay({ score }: { score: RiskScore }) {
  const low = score.salary_band_low_lpa;
  const high = score.salary_band_high_lpa;
  const max = Math.max(high * 1.15, low + 8, 20);
  const leftPct = (low / max) * 100;
  const widthPct = Math.max(((high - low) / max) * 100, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-heading text-lg font-medium text-foreground">
          {formatSalaryBand(low, high)}
        </p>
        <p className="text-xs text-muted-foreground">Modeled range (LPA)</p>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-primary/45 to-primary"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Benchmarks shift with role, city, and employer—use this as a planning band,
        not an offer guarantee.
      </p>
    </div>
  );
}
