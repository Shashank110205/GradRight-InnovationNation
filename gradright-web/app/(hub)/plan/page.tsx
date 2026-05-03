import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Plan",
  description: "Admission planning, timeline, and milestones",
};

export default function PlanHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predict admission odds, map deadlines, and track milestones in one module.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="flex flex-col gap-3 p-6">
          <h2 className="font-heading text-lg font-semibold">Admission predictor</h2>
          <p className="text-sm text-muted-foreground">
            Reach, match, and safer picks for your target universities.
          </p>
          <Link
            href="/plan/admission"
            className={cn(buttonVariants({ variant: "default" }), "mt-auto w-fit")}
          >
            Open predictor →
          </Link>
        </GlassCard>
        <GlassCard className="flex flex-col gap-3 p-6">
          <h2 className="font-heading text-lg font-semibold">Application timeline</h2>
          <p className="text-sm text-muted-foreground">
            Personalized deadlines and checklist from your profile.
          </p>
          <Link
            href="/plan/timeline"
            className={cn(buttonVariants({ variant: "secondary" }), "mt-auto w-fit")}
          >
            View timeline →
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
