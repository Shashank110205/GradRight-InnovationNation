import { SkeletonInsightTile, SkeletonNewsTile, SkeletonWeeklyTasksTile } from "@/components/student/dashboard/DashboardDeferredTileSkeletons";
import { GlassCard } from "@/components/shell/GlassCard";
import { JourneyBar } from "@/components/shared/JourneyBar";
import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted/70 via-muted/40 to-muted/70 bg-[length:200%_100%]",
        className
      )}
      aria-hidden
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="relative min-h-0 space-y-6 md:space-y-8">
      <div>
        <JourneyBar currentStage="discover" />
      </div>
      <section className="rounded-2xl border border-border/70 bg-card/55 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <Bar className="h-3 w-24" />
        <Bar className="mt-3 h-4 w-full max-w-lg" />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Bar className="h-11 rounded-xl" />
          <Bar className="h-11 rounded-xl" />
          <Bar className="h-11 rounded-xl" />
        </div>
      </section>
      <GlassCard className="p-6 md:p-7">
        <Bar className="h-3 w-40" />
        <Bar className="mt-4 h-8 w-2/3 max-w-md" />
        <Bar className="mt-3 h-4 w-full" />
        <Bar className="mt-2 h-4 w-4/5" />
      </GlassCard>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Bar className="h-3 w-32" />
          <Bar className="h-3 w-24" />
          <Bar className="h-10 w-full max-w-md" />
        </div>
        <Bar className="h-11 w-11 shrink-0 rounded-full" />
      </header>
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <GlassCard className="min-h-[200px] p-6 lg:col-span-5">
          <div className="flex gap-6">
            <Bar className="h-28 w-28 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-3/4" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-5/6" />
            </div>
          </div>
        </GlassCard>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-7">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="h-24 p-3">
              <Bar className="h-3 w-16" />
              <Bar className="mt-2 h-6 w-12" />
            </GlassCard>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Personalizing your dashboard…
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonInsightTile />
        <SkeletonNewsTile />
        <SkeletonWeeklyTasksTile />
      </div>
    </div>
  );
}
