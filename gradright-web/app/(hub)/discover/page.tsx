import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Discover",
  description: "Universities, courses, and destinations",
};

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Discover
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore programs, destinations, and how they line up with your profile. Deep
          search and comparisons ship here next.
        </p>
      </div>

      <GlassCard className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          For now, use the admission predictor under Plan to stress-test targets against
          your profile — it feeds the same decision data model this module will expand on.
        </p>
        <Link
          href="/plan/admission"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex w-fit")}
        >
          Go to admission predictor →
        </Link>
      </GlassCard>
    </div>
  );
}
