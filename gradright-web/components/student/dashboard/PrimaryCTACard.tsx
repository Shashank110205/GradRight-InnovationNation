import {
  ArrowRight,
  Briefcase,
  FileText,
  LineChart,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { MODULE_ROUTES } from "@/lib/dashboard/module-registry";
import { cn } from "@/lib/utils";
import type { JourneyStage } from "@/lib/types";

const COPY: Record<
  JourneyStage,
  { headline: string; line: string; cta: string; icon: typeof Sparkles }
> = {
  discover: {
    headline: "Explore what's possible before you lock targets",
    line: "Discover feed + guides reduce confusion; then stress-test picks with the admission predictor.",
    cta: "Open Explore",
    icon: Sparkles,
  },
  plan: {
    headline: "Run your Admission Predictor for your target universities",
    line: "See reach, match, and safer picks on the admission predictor.",
    cta: "Go to admission predictor",
    icon: LineChart,
  },
  finance: {
    headline: "Build funding confidence without the pressure play",
    line: "Costs, living velocity, and scholarships first — smart tools when you choose them.",
    cta: "Open funding hub",
    icon: Wallet,
  },
  apply: {
    headline: "Continue your loan application",
    line: "Upload documents once and track NBFC review from the loan workspace.",
    cta: "Open loan application",
    icon: FileText,
  },
  succeed: {
    headline: "Career & placement insights",
    line: "Placement outlook, salary bands, and milestones live on your career hub.",
    cta: "Open career hub",
    icon: Briefcase,
  },
};

export function PrimaryCTACard({ stage }: { stage: JourneyStage }) {
  const c = COPY[stage];
  const Icon = c.icon;
  const href = MODULE_ROUTES[stage];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 p-6 text-white shadow-elegant md:p-8",
        "bg-gradient-to-br from-brand-primary via-brand-secondary to-indigo-700"
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon className="size-6" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold leading-snug md:text-xl">
              {c.headline}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/90 md:text-base">{c.line}</p>
          </div>
        </div>
        <Link
          href={href}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-primary shadow-md transition hover:bg-white/95"
          )}
        >
          {c.cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
