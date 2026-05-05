import Link from "next/link";
import { notFound } from "next/navigation";

import { GlassCard } from "@/components/shell/GlassCard";
import { AskAiArticleButton } from "@/components/student/explore/AskAiArticleButton";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardAuthContext } from "@/lib/dashboard/get-dashboard-auth";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { getDiscoverArticle, discoverArticleSlugs } from "@/lib/discover/articles";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return discoverArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const a = getDiscoverArticle(slug);
  if (!a) return { title: "Article" };
  return {
    title: `${a.title} · Explore`,
    description: a.dek,
  };
}

export default async function DiscoverArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getDiscoverArticle(slug);
  if (!article) notFound();
  const auth = await getDashboardAuthContext();
  const profile = auth ? await getStudentProfileByUserId(auth.appUser.id) : null;
  const countryLabel = profile?.target_country?.trim() || "your chosen destinations";
  const fieldLabel = profile?.broad_field?.trim() || "your target field";
  const intakeLabel = profile?.target_intake?.trim() || "your intake window";
  const budgetLabel = profile?.budget_band_usd
    ? profile.budget_band_usd
        .replace("Under $30,000", "Under ₹25 lakh / year")
        .replace("$30,000 – $50,000", "₹25–₹42 lakh / year")
        .replace("$50,000 – $80,000", "₹42–₹67 lakh / year")
        .replace("Above $80,000", "Above ₹67 lakh / year")
    : "your budget band";

  const personalizedForYou = (() => {
    if (slug === "country-guides-overview") {
      return `For ${fieldLabel} in ${countryLabel}, compare visa speed, cost realism (${budgetLabel}), and post-study work pathways before ranking countries.`;
    }
    if (slug === "admissions-explained") {
      return `For ${countryLabel}, admissions improve when your ${fieldLabel} proof points (projects, internships, and test readiness) match the program rubric and ${intakeLabel}.`;
    }
    if (slug === "scholarship-strategy-starter") {
      return `Prioritize scholarships that explicitly match ${countryLabel} + ${fieldLabel}; build 3 reusable stories so each application is specific, not generic.`;
    }
    if (slug === "financial-literacy-abroad") {
      return `Model your plan around ${budgetLabel}: tuition + living + FX buffer for ${countryLabel}, then stress-test monthly cash flow before finalizing funding decisions.`;
    }
    return `Use ${countryLabel}, ${fieldLabel}, and ${intakeLabel} as hard filters so your decisions stay realistic and personalized.`;
  })();

  const personalizedAction = (() => {
    if (slug === "country-guides-overview") {
      return `Shortlist 3 countries for ${fieldLabel} in ${countryLabel} and score each on visa, cost, and placement fit.`;
    }
    if (slug === "admissions-explained") {
      return "Build a 5-point evidence list (projects, internships, tests, LOR, goals) and map each to admissions criteria.";
    }
    if (slug === "scholarship-strategy-starter") {
      return "Pick 3 high-fit scholarships and draft one reusable 150-word impact story for each.";
    }
    if (slug === "financial-literacy-abroad") {
      return "Create a 12-month cash-flow sheet in INR with rent, food, tuition milestones, and a 10% risk buffer.";
    }
    return article.recommendedAction;
  })();

  const financialPlanner = (() => {
    if (slug !== "financial-literacy-abroad") return null;
    const budgetRaw = profile?.budget_band_usd ?? "";
    const annualInr =
      budgetRaw.includes("Under $30,000")
        ? 2_500_000
        : budgetRaw.includes("$30,000")
          ? 3_300_000
          : budgetRaw.includes("$50,000")
            ? 5_100_000
            : budgetRaw.includes("Above $80,000")
              ? 7_000_000
              : 3_800_000;
    const annualWithBuffer = Math.round(annualInr * 1.1);
    const monthlyRunway = Math.round(annualWithBuffer / 12);
    const fmt = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
    return {
      annualInr,
      annualWithBuffer,
      monthlyRunway,
      fmt,
    };
  })();

  const countryGuidePlanner = (() => {
    if (slug !== "country-guides-overview") return null;
    const countryRaw = profile?.target_country?.trim() || "";
    const countries = countryRaw
      .split(/[,/]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3);
    const field = profile?.broad_field?.trim() || "your field";
    const intake = profile?.target_intake?.trim() || "your intake";
    return { countries, field, intake };
  })();

  const admissionPlanner = (() => {
    if (slug !== "admissions-explained") return null;
    const cgpa = typeof profile?.cgpa === "number" ? profile.cgpa : null;
    const intake = profile?.target_intake?.trim() || "your intake";
    const field = profile?.broad_field?.trim() || "your target field";
    const strengthBand =
      cgpa == null ? "unknown" : cgpa >= 8 ? "strong" : cgpa >= 7 ? "competitive" : "developing";
    return { cgpa, intake, field, strengthBand };
  })();

  const scholarshipPlanner = (() => {
    if (slug !== "scholarship-strategy-starter") return null;
    const country = profile?.target_country?.trim() || "your target country";
    const field = profile?.broad_field?.trim() || "your field";
    const hasWorkExp =
      typeof profile?.work_experience_years === "number" && profile.work_experience_years > 0;
    const storyAnchor = hasWorkExp
      ? "work outcomes + measurable impact"
      : "projects/research outcomes + measurable impact";
    return { country, field, storyAnchor };
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div>
        <Link
          href="/explore"
          className="text-xs font-semibold uppercase tracking-wide text-brand-primary hover:underline"
        >
          ← Discover feed
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">{article.dek}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {article.countryTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {article.fieldTags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-[11px] font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <GlassCard className="space-y-8 border-border/80 p-6 md:p-8">
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
            What happened
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground md:text-base">
            {article.whatHappened}
          </p>
        </section>
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
            Why it matters
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground md:text-base">
            {article.whyItMatters}
          </p>
        </section>
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
            What it means for you
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground md:text-base">
            {personalizedForYou}
          </p>
        </section>
        <section className="rounded-xl border border-brand-primary/25 bg-brand-primary/5 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Recommended action
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground">{personalizedAction}</p>
        </section>

        {financialPlanner ? (
          <section className="space-y-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Money Plan Snapshot (Personalized)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Annual budget signal
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {financialPlanner.fmt(financialPlanner.annualInr)}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  With 10% safety buffer
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {financialPlanner.fmt(financialPlanner.annualWithBuffer)}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Monthly runway target
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {financialPlanner.fmt(financialPlanner.monthlyRunway)}
                </p>
              </div>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>
                Split costs into <span className="font-medium text-foreground">one-time</span>{" "}
                (deposit, visa, flights) and{" "}
                <span className="font-medium text-foreground">recurring</span> (rent, food, commute).
              </li>
              <li>
                Keep at least <span className="font-medium text-foreground">2 months of living
                runway</span> untouched for FX spikes or delayed disbursals.
              </li>
              <li>
                Compare decisions in <span className="font-medium text-foreground">INR cash flow</span>,
                not just headline tuition.
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/funding"
                className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}
              >
                Open Funding Planner
              </Link>
              <Link
                href="/dashboard/score-upgrade"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Improve My Profile
              </Link>
            </div>
          </section>
        ) : null}

        {countryGuidePlanner ? (
          <section className="space-y-4 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              Destination Decision Snapshot (Personalized)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Focus field
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{countryGuidePlanner.field}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Intake signal
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{countryGuidePlanner.intake}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Country shortlist
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {countryGuidePlanner.countries.length
                    ? countryGuidePlanner.countries.join(", ")
                    : "Add destinations in Improve Profile"}
                </p>
              </div>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>Score each country on visa speed, post-study work options, and realistic salary-entry pathways.</li>
              <li>Use one consistent cost template (tuition + living + emergency buffer) for apples-to-apples comparison.</li>
              <li>Keep one safe, one balanced, and one ambitious destination in your first shortlist.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/career/navigator" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
                Show Recommendations
              </Link>
              <Link
                href="/dashboard/score-upgrade"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Improve My Profile
              </Link>
            </div>
          </section>
        ) : null}

        {admissionPlanner ? (
          <section className="space-y-4 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
              Admissions Readiness Snapshot (Personalized)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Current CGPA
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {admissionPlanner.cgpa != null ? admissionPlanner.cgpa.toFixed(1) : "Not available"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Strength band
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-foreground">{admissionPlanner.strengthBand}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Intake
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{admissionPlanner.intake}</p>
              </div>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>For {admissionPlanner.field}, map each university requirement to one evidence line in your profile.</li>
              <li>Lock test planning first; then align SOP/LOR around one clear story arc.</li>
              <li>Prioritize schools where your current signals match at least 70% of stated requirements.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/plan/admission" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
                See My Chances
              </Link>
              <Link
                href="/dashboard/score-upgrade"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Improve My Profile
              </Link>
            </div>
          </section>
        ) : null}

        {scholarshipPlanner ? (
          <section className="space-y-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
              Scholarship Strategy Snapshot (Personalized)
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Target region
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{scholarshipPlanner.country}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Field focus
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{scholarshipPlanner.field}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Story anchor
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{scholarshipPlanner.storyAnchor}</p>
              </div>
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>Start with 3–5 high-fit scholarships for {scholarshipPlanner.country} + {scholarshipPlanner.field}.</li>
              <li>Reuse one core impact narrative, but tailor opening lines to each scholarship prompt.</li>
              <li>Track deadlines backward with a 2-week safety buffer to avoid rushed, low-quality submissions.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/funding" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
                Open Funding Planner
              </Link>
              <Link
                href="/dashboard/score-upgrade"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
              >
                Improve My Profile
              </Link>
            </div>
          </section>
        ) : null}
      </GlassCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <AskAiArticleButton seed={article.askAiSeed} />
        <Link href="/explore" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
