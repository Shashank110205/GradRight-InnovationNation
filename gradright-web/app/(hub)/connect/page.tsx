import Link from "next/link";

import { GlassCard } from "@/components/shell/GlassCard";
import { OpenMentorButton } from "@/components/student/connect/OpenMentorButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Connect",
  description: "AI mentor, community, and profile deepening — stay improving.",
};

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-pink">
          Connect · Who helps me improve?
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Mentorship, peers, and signal — without noise
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One AI backbone, different modes by surface. Community is staged for trust: start with
          goals and geography, not endless feeds.
        </p>
      </div>

      <section id="mentor" className="scroll-mt-24">
        <GlassCard className="border-brand-primary/25 bg-gradient-to-br from-brand-primary/10 via-card to-violet-500/10 p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">AI mentor</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Strategic on the dashboard, awareness-first in Discover, explain-and-challenge on result
            screens, adaptive in profile deepening.
          </p>
          <OpenMentorButton className="mt-4" />
        </GlassCard>
      </section>

      <section id="community" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Community</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Peer lenses reduce fear: same city → same destination, same field → same country, same
            stage → same deadlines. Live cohorts ship next; for now, use mentor + Explore to
            rehearse questions you&apos;d ask a senior.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>· Mumbai → Ireland (example cohort lens)</li>
            <li>· CS → USA (goal + field lens)</li>
            <li>· Intake season timeline buddies (stage lens)</li>
          </ul>
        </GlassCard>
      </section>

      <section id="peers" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Peer groups (preview)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Region + goal matching will unlock here. Your profile country and field already seed
            Explore — we&apos;ll connect the social graph without spam.
          </p>
        </GlassCard>
      </section>

      <section id="alerts" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Notifications</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Timeline and digest nudges will land here. Today: use your dashboard weekly mission and
            timeline for deadline pressure.
          </p>
          <Link
            href="/plan/timeline"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex")}
          >
            Open timeline →
          </Link>
        </GlassCard>
      </section>

      <section id="cohorts" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Sample cohort threads</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Static previews of how regional and goal cohorts will feel — no live chat yet, but the
            tone is intentional: calm, specific, and outcome-linked.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                Mumbai → Ireland · Fall 2026
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg bg-background/80 px-3 py-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Aisha:</span> Anyone negotiating
                  deposit deadlines with Trinity / UCD admits?
                </p>
                <p className="rounded-lg bg-brand-primary/10 px-3 py-2 text-foreground/90">
                  <span className="font-medium text-brand-primary">Mentor note:</span> Lead with
                  program-specific deferral policy + proof of funds timeline — Irish visas reward
                  clean bank narratives.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary">
                US Fall 2027 · CS scholarship-first
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg bg-background/80 px-3 py-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Jordan:</span> Is it worth sending
                  a funding appeal before the April wave?
                </p>
                <p className="rounded-lg bg-brand-secondary/15 px-3 py-2 text-foreground/90">
                  <span className="font-medium text-brand-secondary">Peer:</span> Yes — attach one
                  new signal (paper, internship, stronger LOR) and keep it under 180 words.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Profile deepening</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sharper predictions and calmer funding conversations come from structured accuracy — AI
            conversation first, forms as backup.
          </p>
          <Link
            href="/dashboard/score-upgrade"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "mt-4 inline-flex bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-95"
            )}
          >
            Improve accuracy →
          </Link>
        </GlassCard>
      </section>
    </div>
  );
}
