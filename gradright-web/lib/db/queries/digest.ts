import { db } from "@/lib/db/client";
import {
  loan_applications,
  nudge_log,
  student_profiles,
  user_events,
  users,
} from "@/lib/db/schema";
import type { JourneyStage } from "@/lib/types";
import { and, desc, eq, gte, not, notExists, sql } from "drizzle-orm";

export type DigestEligibleUserRow = {
  userId: string;
  email: string;
  full_name: string | null;
  journey_stage: JourneyStage;
};

/** Users ready for the weekly email: onboarded students, not in post-loan / succeed stage, no recent duplicate digest. */
export async function listWeeklyDigestEligibleUsers(options?: {
  skipIfDigestWithinDays?: number;
}): Promise<DigestEligibleUserRow[]> {
  const skipDays = options?.skipIfDigestWithinDays ?? 6;
  const cutoff = new Date(Date.now() - skipDays * 24 * 60 * 60 * 1000).toISOString();

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      full_name: users.full_name,
      journey_stage: users.journey_stage,
    })
    .from(users)
    .innerJoin(student_profiles, eq(student_profiles.user_id, users.id))
    .where(
      and(
        eq(users.onboarding_complete, true),
        eq(users.role, "student"),
        not(eq(users.journey_stage, "succeed")),
        notExists(
          db
            .select({ x: sql`1` })
            .from(loan_applications)
            .where(
              and(
                eq(loan_applications.user_id, users.id),
                eq(loan_applications.status, "approved")
              )
            )
        ),
        notExists(
          db
            .select({ x: sql`1` })
            .from(nudge_log)
            .where(
              and(
                eq(nudge_log.user_id, users.id),
                eq(nudge_log.nudge_type, "weekly_digest"),
                gte(nudge_log.sent_at, cutoff)
              )
            )
        )
      )
    );

  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    full_name: r.full_name,
    journey_stage: r.journey_stage as JourneyStage,
  }));
}

export type UserEventDigestRow = {
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export async function getUserEventsSince(
  userId: string,
  sinceIso: string
): Promise<UserEventDigestRow[]> {
  const rows = await db
    .select({
      event_type: user_events.event_type,
      event_data: user_events.event_data,
      created_at: user_events.created_at,
    })
    .from(user_events)
    .where(and(eq(user_events.user_id, userId), gte(user_events.created_at, sinceIso)))
    .orderBy(desc(user_events.created_at))
    .limit(40);

  return rows.map((r) => ({
    event_type: r.event_type,
    event_data: (r.event_data as Record<string, unknown> | null) ?? null,
    created_at: r.created_at,
  }));
}
