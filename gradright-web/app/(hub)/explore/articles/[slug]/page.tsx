import Link from "next/link";
import { notFound } from "next/navigation";

import { GlassCard } from "@/components/shell/GlassCard";
import { AskAiArticleButton } from "@/components/student/explore/AskAiArticleButton";
import { buttonVariants } from "@/components/ui/button";
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
            {article.forYou}
          </p>
        </section>
        <section className="rounded-xl border border-brand-primary/25 bg-brand-primary/5 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Recommended action
          </h2>
          <p className="mt-2 text-sm font-medium text-foreground">{article.recommendedAction}</p>
        </section>
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
