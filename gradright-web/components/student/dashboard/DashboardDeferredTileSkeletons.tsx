import { cn } from "@/lib/utils";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]",
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonNewsTile() {
  return (
    <section
      className="flex h-full min-h-[220px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-busy
      aria-label="Loading news"
    >
      <ShimmerBlock className="h-4 w-28" />
      <ShimmerBlock className="mt-2 h-3 w-full max-w-md" />
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <ShimmerBlock className="h-24 w-full" />
        <ShimmerBlock className="h-24 w-full" />
      </div>
    </section>
  );
}

export function SkeletonInsightTile() {
  return (
    <section
      className="flex h-full min-h-[220px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-busy
      aria-label="Loading insight"
    >
      <ShimmerBlock className="h-4 w-36" />
      <ShimmerBlock className="mt-4 h-3 w-full" />
      <ShimmerBlock className="mt-2 h-3 w-[90%]" />
      <ShimmerBlock className="mt-2 h-3 w-[75%]" />
    </section>
  );
}

export function SkeletonWeeklyTasksTile() {
  return (
    <section
      className="flex h-full min-h-[220px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
      aria-busy
      aria-label="Loading weekly tasks"
    >
      <ShimmerBlock className="h-4 w-40" />
      <div className="mt-4 space-y-2">
        <ShimmerBlock className="h-10 w-full" />
        <ShimmerBlock className="h-10 w-full" />
        <ShimmerBlock className="h-10 w-full" />
      </div>
    </section>
  );
}
