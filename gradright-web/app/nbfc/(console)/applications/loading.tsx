import { Skeleton } from "@/components/ui/skeleton";

export default function NbfcApplicationsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full max-w-2xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
