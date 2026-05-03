import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Succeed",
  description: "Visa, relocation, and employability after admits",
};

export default function SucceedPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Succeed
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visa pathways, relocation readiness, and employability signals — the chapter
          after your offer.
        </p>
      </div>

      <GlassCard className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Placement and salary context for your cohort is already live in Career. This
          hub will grow with visa checklists and relocation playbooks.
        </p>
        <Link
          href="/career"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex w-fit")}
        >
          Open career & placement →
        </Link>
      </GlassCard>
    </div>
  );
}
