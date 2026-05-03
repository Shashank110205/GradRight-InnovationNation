import { db } from "@/lib/db/client";
import { gamification_rewards, users } from "@/lib/db/schema";
import { getRewardForAction } from "@/lib/gamification/xp-taxonomy";
import type { JourneyStage, User } from "@/lib/types";
import { eq, sql } from "drizzle-orm";

function mapUserRow(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    supabase_uid: row.supabase_uid,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    role: row.role,
    consent_given: row.consent_given,
    consent_timestamp: row.consent_timestamp ?? null,
    onboarding_complete: row.onboarding_complete,
    wow_completed: row.wow_completed,
    journey_stage: row.journey_stage,
    xp_points: row.xp_points,
    streak_days: row.streak_days,
    last_active_date: row.last_active_date ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Calendar date YYYY-MM-DD in Asia/Kolkata (IST). */
function todayISTYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Days between two YYYY-MM-DD strings (b - a) in Gregorian calendar. */
function calendarDaysBetweenYmd(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ua = Date.UTC(ay, am - 1, ad);
  const ub = Date.UTC(by, bm - 1, bd);
  return Math.round((ub - ua) / (24 * 60 * 60 * 1000));
}

/**
 * Ensures a `users` row exists for the Supabase auth user (e.g. first onboarding).
 */
export async function ensureUserFromAuth(auth: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string };
}): Promise<User> {
  const existing = await getUserBySupabaseUID(auth.id);
  if (existing) {
    return existing;
  }

  const email = auth.email?.trim();
  if (!email) {
    throw new Error("Auth user has no email");
  }

  const fullName =
    typeof auth.user_metadata?.full_name === "string"
      ? auth.user_metadata.full_name
      : null;

  try {
    const inserted = await db
      .insert(users)
      .values({
        supabase_uid: auth.id,
        email,
        full_name: fullName,
      })
      .returning();

    const row = inserted[0];
    if (!row) {
      throw new Error("Insert returned no row");
    }
    return mapUserRow(row);
  } catch (error) {
    console.error("[ensureUserFromAuth]", error);
    throw error;
  }
}

export async function getUserBySupabaseUID(uid: string): Promise<User | null> {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.supabase_uid, uid))
      .limit(1);

    const row = rows[0];
    return row ? mapUserRow(row) : null;
  } catch (error) {
    console.error("[getUserBySupabaseUID]", error);
    throw error;
  }
}

export async function setUserWowComplete(userId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await db
      .update(users)
      .set({
        wow_completed: true,
        updated_at: now,
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[setUserWowComplete]", error);
    throw error;
  }
}

export async function setUserOnboardingAndConsentComplete(
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await db
      .update(users)
      .set({
        onboarding_complete: true,
        consent_given: true,
        consent_timestamp: now,
        updated_at: now,
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[setUserOnboardingAndConsentComplete]", error);
    throw error;
  }
}

export async function updateUserJourneyStage(
  userId: string,
  stage: JourneyStage
): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        journey_stage: stage,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[updateUserJourneyStage]", error);
    throw error;
  }
}

export async function updateUserXP(
  userId: string,
  xpToAdd: number
): Promise<number> {
  try {
    const out = await db
      .update(users)
      .set({
        xp_points: sql`${users.xp_points} + ${xpToAdd}`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({ xp_points: users.xp_points });

    const row = out[0];
    if (!row) {
      throw new Error(`User not found: ${userId}`);
    }
    return row.xp_points;
  } catch (error) {
    console.error("[updateUserXP]", error);
    throw error;
  }
}

export type DailyStreakCheckResult = {
  streak_days: number;
  xp_awarded: number;
  badge_unlocked: string | null;
};

/**
 * Once per calendar day (IST). Idempotent if `last_active_date` is already today.
 * Gap of 2+ days resets streak to 1 on return (BUILD_ORDER); milestones at 7 / 30 days.
 */
export async function applyDailyStreakCheck(
  userId: string
): Promise<DailyStreakCheckResult> {
  try {
    return await db.transaction(async (tx) => {
      const rows = await tx
        .select({
          streak_days: users.streak_days,
          last_active_date: users.last_active_date,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new Error(`User not found: ${userId}`);
      }

      const today = todayISTYmd();

      if (row.last_active_date === today) {
        return {
          streak_days: row.streak_days,
          xp_awarded: 0,
          badge_unlocked: null,
        };
      }

      const last = row.last_active_date;
      let newStreak: number;

      if (last == null) {
        newStreak = 1;
      } else {
        const diff = calendarDaysBetweenYmd(last, today);
        if (diff === 1) {
          newStreak = row.streak_days + 1;
        } else if (diff > 1) {
          newStreak = 1;
        } else {
          newStreak = row.streak_days;
        }
      }

      const now = new Date().toISOString();

      await tx
        .update(users)
        .set({
          streak_days: newStreak,
          last_active_date: today,
          updated_at: now,
        })
        .where(eq(users.id, userId));

      let xpAwarded = 0;
      let badgeUnlocked: string | null = null;

      if (newStreak === 7) {
        const { xp, badge } = getRewardForAction("streak_7_days");
        xpAwarded += xp;
        badgeUnlocked = badge;
        await tx.insert(gamification_rewards).values({
          user_id: userId,
          action: "streak_7_days",
          xp_earned: xp,
          badge_unlocked: badge,
          updated_at: now,
        });
        await tx
          .update(users)
          .set({
            xp_points: sql`${users.xp_points} + ${xp}`,
            updated_at: now,
          })
          .where(eq(users.id, userId));
      } else if (newStreak === 30) {
        const { xp, badge } = getRewardForAction("streak_30_days");
        xpAwarded += xp;
        badgeUnlocked = badge;
        await tx.insert(gamification_rewards).values({
          user_id: userId,
          action: "streak_30_days",
          xp_earned: xp,
          badge_unlocked: badge,
          updated_at: now,
        });
        await tx
          .update(users)
          .set({
            xp_points: sql`${users.xp_points} + ${xp}`,
            updated_at: now,
          })
          .where(eq(users.id, userId));
      }

      return {
        streak_days: newStreak,
        xp_awarded: xpAwarded,
        badge_unlocked: badgeUnlocked,
      };
    });
  } catch (error) {
    console.error("[applyDailyStreakCheck]", error);
    throw error;
  }
}

/** Sets partner role after NBFC self-signup (guarded by API env). */
export async function promoteUserToNbfcSupervisor(
  supabaseUid: string,
  displayName: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const out = await db
      .update(users)
      .set({
        role: "nbfc_supervisor",
        full_name: displayName,
        updated_at: now,
      })
      .where(eq(users.supabase_uid, supabaseUid))
      .returning({ id: users.id });

    if (!out[0]) {
      throw new Error(
        `[promoteUserToNbfcSupervisor] no users row matched supabase_uid=${supabaseUid}`
      );
    }
  } catch (error) {
    console.error("[promoteUserToNbfcSupervisor]", error);
    throw error;
  }
}
