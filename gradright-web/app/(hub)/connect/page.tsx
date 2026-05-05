import Link from "next/link";

import { CommunityChatPreview } from "@/components/student/connect/CommunityChatPreview";
import { OpenMentorButton } from "@/components/student/connect/OpenMentorButton";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Connect",
  description: "Mentor, community, and profile — stay improving.",
};

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Connect · Who helps me improve?
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          People, perspective, and next steps
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A calm place to get guidance, see how others think about the same stage, and strengthen
          your profile without noise.
        </p>
      </div>

      <section id="mentor" className="scroll-mt-24">
        <GlassCard className="border-brand-primary/25 bg-gradient-to-br from-brand-primary/10 via-card to-violet-500/10 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-pink">
            Mentor Companion
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-foreground">
            Your Mentor — clear, personal, and action-first
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Built as your study-abroad decision companion: personalized to your profile, aware of
            your progress, and focused on what to do next instead of generic motivation.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Personalized advice using your profile and goals
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Step-by-step help for admissions, funding, and timelines
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Explainable suggestions with assumptions, not black-box answers
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
              Designed to reduce confusion and speed up decisions
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <OpenMentorButton label="Start with Mentor Companion" />
            <Link
              href="/dashboard/score-upgrade"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
            >
              Improve mentor context
            </Link>
          </div>
        </GlassCard>
      </section>

      <section id="community" className="scroll-mt-24">
        <CommunityChatPreview />
      </section>

      <section id="peers" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Peer Network</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Region and goal matching will unlock here. Your destination and field already shape
            Explore — we&apos;ll connect the social graph without spam.
          </p>
        </GlassCard>
      </section>

      <section id="alerts" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Updates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Timeline and digest nudges will land here. For now, use your weekly mission and timeline
            for deadline pressure.
          </p>
          <Link
            href="/plan/timeline"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex rounded-xl")}
          >
            Open your timeline
          </Link>
        </GlassCard>
      </section>

      <section className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Improve Profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sharper predictions and calmer funding conversations come from structured detail — start
            with a short conversation, use forms as backup.
          </p>
          <Link
            href="/dashboard/score-upgrade"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "mt-4 inline-flex rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-95"
            )}
          >
            Improve My Profile
          </Link>
        </GlassCard>
      </section>
    </div>
  );
}
