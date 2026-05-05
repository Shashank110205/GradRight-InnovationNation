import type { GroundedContextV1, GroundedUniversityRow } from "@/lib/profile/grounded-context";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function mergeRequirementStrings(ctx: GroundedContextV1 | null): string[] {
  if (!ctx) return [];
  const set = new Set<string>();
  for (const u of ctx.universities) {
    for (const r of u.requirements ?? []) {
      const t = r.trim();
      if (t) set.add(t);
    }
  }
  return [...set].slice(0, 48);
}

export function groupUniversitiesByCountry(
  unis: GroundedUniversityRow[]
): Record<string, { universities: GroundedUniversityRow[] }> {
  const out: Record<string, { universities: GroundedUniversityRow[] }> = {};
  for (const u of unis) {
    const c = u.country.trim() || "Unknown";
    if (!out[c]) out[c] = { universities: [] };
    out[c].universities.push(u);
  }
  return out;
}

export function aggregateTimelineHints(ctx: GroundedContextV1 | null): string[] {
  if (!ctx) return [];
  const set = new Set<string>();
  for (const u of ctx.universities) {
    const t = u.timeline?.trim();
    if (t) set.add(`${u.name}: ${t}`);
  }
  return [...set].slice(0, 24);
}

/** Scholarship-oriented hints — grounded schema has no dedicated scholarships[]; use insights + fit copy. */
export function scholarshipHintsFromContext(ctx: GroundedContextV1 | null): string[] {
  if (!ctx) return [];
  const hints: string[] = [];
  for (const s of ctx.student_insights.slice(0, 8)) {
    const blob = `${s.title} ${s.summary}`;
    if (/scholar|aid|fellow|stipend|MERIT|funding/i.test(blob)) {
      hints.push(`${s.title}: ${s.summary.slice(0, 240)}`);
    }
  }
  for (const u of ctx.universities.slice(0, 10)) {
    if (/aid|scholar|assistant|fellow/i.test(u.fit_reason)) {
      hints.push(`${u.name}: ${u.fit_reason.slice(0, 200)}`);
    }
  }
  return hints.slice(0, 16);
}

export function parseProfileResumeSkills(meta: Record<string, unknown>): string[] {
  const pi = meta.profile_intelligence;
  if (!isRecord(pi)) return [];
  const resume = isRecord(pi.resume) ? pi.resume : null;
  const skills = resume && Array.isArray(resume.skills) ? resume.skills : [];
  return skills.filter((s): s is string => typeof s === "string").slice(0, 80);
}
