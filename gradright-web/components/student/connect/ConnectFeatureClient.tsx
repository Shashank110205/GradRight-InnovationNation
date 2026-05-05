"use client";

import Link from "next/link";

import { CommunityChatPreview } from "@/components/student/connect/CommunityChatPreview";
import { OpenMentorButton } from "@/components/student/connect/OpenMentorButton";
import { GlassCard } from "@/components/shell/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { useFeatureApi } from "@/lib/hooks/useFeatureApi";
import { cn } from "@/lib/utils";

export function ConnectFeatureClient() {
  const community = useFeatureApi<Record<string, unknown>>("community");
  const peers = useFeatureApi<Record<string, unknown>>("peers");
  const updates = useFeatureApi<Record<string, unknown>>("notifications");

  const communityHighlights = Array.isArray(community.data?.highlights)
    ? (community.data?.highlights as string[])
    : [];
  const communityContext =
    typeof community.data?.note === "string" ? (community.data.note as string) : undefined;

  const peerGroups = Array.isArray(peers.data?.peer_groups_preview)
    ? (peers.data?.peer_groups_preview as Array<{ lens?: string; example?: string }>)
    : [];
  const notifications = Array.isArray(updates.data?.notifications)
    ? (updates.data?.notifications as Array<{ title?: string; body?: string }>)
    : [];

  return (
    <>
      <section id="mentor" className="scroll-mt-24">
        <GlassCard className="border-brand-primary/25 bg-gradient-to-br from-brand-primary/10 via-card to-violet-500/10 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-pink">
            Mentor Companion
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-foreground">
            Your Mentor - clear, personal, and action-first
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
        <CommunityChatPreview
          profileContext={communityContext}
          communityHighlights={communityHighlights}
        />
      </section>

      <section id="peers" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Peer Network</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These peer clusters are generated from your profile signals.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {peerGroups.slice(0, 3).map((g, i) => (
              <li key={`${g.lens}-${i}`} className="rounded-lg border border-border/60 px-3 py-2">
                <span className="font-medium text-foreground">{g.lens ?? "Match"}:</span>{" "}
                {g.example ?? ""}
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <section id="alerts" className="scroll-mt-24">
        <GlassCard className="p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Updates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Profile-aware reminders combining timeline nudges and improvement opportunities.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {notifications.slice(0, 4).map((n, i) => (
              <li key={`${n.title}-${i}`} className="rounded-lg border border-border/60 px-3 py-2">
                <span className="font-medium text-foreground">{n.title ?? "Update"}:</span>{" "}
                {n.body ?? ""}
              </li>
            ))}
          </ul>
          <Link
            href="/plan/timeline"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 inline-flex rounded-xl")}
          >
            Open your timeline
          </Link>
        </GlassCard>
      </section>
    </>
  );
}

