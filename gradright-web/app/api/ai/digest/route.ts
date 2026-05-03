import { generateWeeklyDigestJson } from "@/lib/ai/generate-weekly-digest";
import { buildWeeklyTasks } from "@/lib/dashboard/weekly-tasks";
import { buildWeeklyDigestEmailHtml } from "@/lib/email/weekly-digest-html";
import {
  getUserEventsSince,
  listWeeklyDigestEligibleUsers,
  type DigestEligibleUserRow,
} from "@/lib/db/queries/digest";
import { insertNudgeLog } from "@/lib/db/queries/nudge_log";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type UserDigestResult =
  | { userId: string; status: "sent" }
  | { userId: string; status: "skipped"; reason: string }
  | { userId: string; status: "error"; message: string };

function verifyCronAuth(request: Request): { ok: true } | { ok: false; message: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
      return { ok: false, message: "CRON_SECRET is not configured" };
    }
    return { ok: true };
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return { ok: false, message: "Unauthorized" };
  }
  return { ok: true };
}

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:3000";
}

async function runWeeklyDigestForUser(row: DigestEligibleUserRow): Promise<UserDigestResult> {
  const deadline = Date.now() + 5000;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [profile, events] = await Promise.all([
    getStudentProfileByUserId(row.userId),
    getUserEventsSince(row.userId, since),
  ]);

  if (!profile) {
    return { userId: row.userId, status: "skipped", reason: "no_profile" };
  }

  const milestones = buildWeeklyTasks(profile, row.journey_stage).map((t) => ({
    title: t.title,
    due_date: t.dueDate,
    status: t.status,
  }));

  const firstName = row.full_name?.trim().split(/\s+/)[0] ?? "there";

  const digestContext = {
    student_first_name: firstName,
    journey_stage: row.journey_stage,
    profile: {
      target_country: profile.target_country,
      target_intake: profile.target_intake,
      degree_type: profile.degree_type,
      broad_field: profile.broad_field,
      current_academic_level: profile.current_academic_level,
      institute_name: profile.institute_name,
      institute_tier: profile.institute_tier,
    },
    events_last_7_days: events.map((e) => ({
      type: e.event_type,
      at: e.created_at,
      data: e.event_data,
    })),
    upcoming_milestones: milestones,
  };

  if (Date.now() > deadline) {
    return { userId: row.userId, status: "skipped", reason: "timeout_before_ai" };
  }

  const gen = await generateWeeklyDigestJson(JSON.stringify(digestContext));
  if (!gen.ok) {
    return { userId: row.userId, status: "skipped", reason: gen.error };
  }

  if (Date.now() > deadline) {
    return { userId: row.userId, status: "skipped", reason: "timeout_after_ai" };
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!resendKey || !from) {
    return { userId: row.userId, status: "skipped", reason: "resend_not_configured" };
  }

  const origin = appOrigin();
  const { html, textFallback } = buildWeeklyDigestEmailHtml({
    digest: gen.digest,
    appOrigin: origin,
    unsubscribeUrl: `${origin}/dashboard`,
  });

  const resend = new Resend(resendKey);
  const send = await resend.emails.send({
    from,
    to: row.email,
    subject: gen.digest.subject_line,
    html,
    text: textFallback,
  });

  if (send.error) {
    return {
      userId: row.userId,
      status: "error",
      message: send.error.message ?? "resend_error",
    };
  }

  if (Date.now() > deadline) {
    return { userId: row.userId, status: "skipped", reason: "timeout_after_send" };
  }

  await insertNudgeLog({
    userId: row.userId,
    nudgeType: "weekly_digest",
    channel: "email",
    content: JSON.stringify({
      subject: gen.digest.subject_line,
      resend_id: send.data?.id ?? null,
    }).slice(0, 4000),
  });

  return { userId: row.userId, status: "sent" };
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const maxUsers = Math.min(
    500,
    Math.max(1, Number(process.env.WEEKLY_DIGEST_MAX_USERS ?? "120")) || 120
  );

  const users = (await listWeeklyDigestEligibleUsers()).slice(0, maxUsers);
  const results: UserDigestResult[] = [];

  for (let i = 0; i < users.length; i += 10) {
    const batch = users.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map((u) => runWeeklyDigestForUser(u)));
    results.push(...batchResults);
  }

  const summary = {
    processed: results.length,
    sent: results.filter((r) => r.status === "sent").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  };

  return NextResponse.json(summary);
}
