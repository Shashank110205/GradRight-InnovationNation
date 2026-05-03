import { cn } from "@/lib/utils";

const tones = {
  blue: "from-sky-500/12 to-brand-primary/10 border-sky-500/20 text-sky-700 dark:text-sky-200",
  pink: "from-brand-pink/15 to-brand-secondary/10 border-brand-pink/25 text-brand-pink",
  mint: "from-emerald-500/12 to-brand-mint/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
  amber: "from-amber-500/15 to-brand-accent/10 border-amber-500/25 text-amber-800 dark:text-amber-200",
} as const;

export function StatPill({
  icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend: string;
  tone: keyof typeof tones;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md",
        tones[tone]
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-90">
        {icon}
        {label}
      </div>
      <div className="font-heading text-2xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground">{trend}</div>
    </div>
  );
}
