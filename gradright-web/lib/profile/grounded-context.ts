/**
 * Structured web context stored in `user_metadata.profile_hub.grounded_context`.
 * Populated via Gemini + Google Search; no free-form AI blobs — only validated JSON.
 */
import { createHash } from "node:crypto";

import { z } from "zod";

import { parseTargetCountries } from "@/lib/types";

export const GROUNDED_CONTEXT_CACHE_MS = 24 * 60 * 60 * 1000;

export const groundedUniversityRowSchema = z.object({
  name: z.string().max(400),
  country: z.string().max(120),
  tier: z.enum(["safe", "moderate", "ambitious"]),
  /** Why this institution fits this profile (CGPA band, field, role pathway). */
  fit_reason: z.string().max(1200).default(""),
  gaps: z.array(z.string().max(600)).max(16).default([]),
  actions_to_improve: z.array(z.string().max(600)).max(16).default([]),
  /** Qualitative band, e.g. "medium (illustrative)" — not a guarantee. */
  admission_probability: z.string().max(200).default(""),
  acceptance_rate: z.string().max(500).default(""),
  requirements: z.array(z.string().max(800)).max(24).default([]),
  fees: z.string().max(800).default(""),
  timeline: z.string().max(800).default(""),
});

export const groundedJobMarketSchema = z.object({
  roles: z.array(z.string().max(400)).max(40),
  salary_range: z.string().max(800),
  skills: z.array(z.string().max(200)).max(60),
  companies: z.array(z.string().max(200)).max(40),
});

export const groundedStudentInsightSchema = z.object({
  title: z.string().max(200),
  summary: z.string().max(1200),
});

export const groundedContextSchema = z.object({
  universities: z.array(groundedUniversityRowSchema).max(36),
  job_market: groundedJobMarketSchema,
  student_insights: z.array(groundedStudentInsightSchema).max(20),
  last_updated: z.string(),
  /** Hash of profile signals; regeneration when profile changes. */
  search_fingerprint: z.string().max(128).optional(),
});

export type GroundedUniversityRow = z.infer<typeof groundedUniversityRowSchema>;
export type GroundedJobMarket = z.infer<typeof groundedJobMarketSchema>;
export type GroundedStudentInsight = z.infer<typeof groundedStudentInsightSchema>;
export type GroundedContextV1 = z.infer<typeof groundedContextSchema>;

export const EMPTY_GROUNDED_JOB_MARKET: GroundedJobMarket = {
  roles: [],
  salary_range: "",
  skills: [],
  companies: [],
};

export function cgpaToBand(cgpa: number): string {
  if (cgpa >= 8) return "high CGPA (8+)";
  if (cgpa >= 6) return "medium CGPA (6–8)";
  return "low CGPA (<6)";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export type ProfileSignals = {
  countries: string[];
  field: string;
  degree_type: string;
  cgpa: number;
  cgpa_band: string;
  role: string;
  fingerprint: string;
};

/** Derive search variables from Supabase `user_metadata` (profile_hub + profile_intelligence). */
export function extractProfileSignalsFromUserMetadata(
  meta: Record<string, unknown>
): ProfileSignals | null {
  const hubRaw = meta.profile_hub;
  const hub = isRecord(hubRaw) ? hubRaw : null;
  const onboardingAnswers =
    hub?.onboarding && isRecord(hub.onboarding)
      ? (hub.onboarding as { answers?: unknown }).answers
      : undefined;
  const answers = isRecord(onboardingAnswers) ? onboardingAnswers : {};

  const piRaw = meta.profile_intelligence;
  const pi = isRecord(piRaw) ? piRaw : {};
  const resume =
    isRecord(pi.resume) ? pi.resume : hub?.resume_snapshot && isRecord(hub.resume_snapshot)
      ? hub.resume_snapshot
      : null;
  const goals =
    isRecord(pi.goals) ? pi.goals : hub?.goals_snapshot && isRecord(hub.goals_snapshot)
      ? hub.goals_snapshot
      : null;

  const targetCountryStr =
    typeof answers.target_country === "string" ? answers.target_country.trim() : "";
  const countries = parseTargetCountries(targetCountryStr).filter(Boolean);
  const field =
    (typeof answers.broad_field === "string" && answers.broad_field.trim()) ||
    (goals && typeof goals.domain === "string" ? goals.domain.trim() : "") ||
    "";
  const degree_type =
    typeof answers.degree_type === "string" ? answers.degree_type.trim() : "";

  const cgpaRaw = resume && typeof resume.cgpa === "number" ? resume.cgpa : 0;
  const cgpa = Number.isFinite(cgpaRaw) ? Math.min(10, Math.max(0, cgpaRaw)) : 0;
  const cgpa_band = cgpaToBand(cgpa);

  const role =
    goals && typeof goals.target_role === "string" ? goals.target_role.trim() : "";

  if (countries.length === 0 || !field.trim() || !role.trim()) {
    return null;
  }

  const fingerprint = stableFingerprint({
    countries,
    field: field.trim(),
    degree_type,
    cgpa_band,
    role: role.trim(),
  });

  return {
    countries,
    field: field.trim(),
    degree_type,
    cgpa,
    cgpa_band,
    role: role.trim(),
    fingerprint,
  };
}

function stableFingerprint(input: {
  countries: string[];
  field: string;
  degree_type: string;
  cgpa_band: string;
  role: string;
}): string {
  const normalized = {
    countries: [...input.countries].sort(),
    field: input.field.toLowerCase(),
    degree_type: input.degree_type.toLowerCase(),
    cgpa_band: input.cgpa_band,
    role: input.role.toLowerCase(),
  };
  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("base64url")
    .slice(0, 96);
}

export function isGroundedContextFresh(
  ctx: GroundedContextV1 | null | undefined,
  expectedFingerprint: string
): boolean {
  if (!ctx?.last_updated) return false;
  if (ctx.search_fingerprint && ctx.search_fingerprint !== expectedFingerprint) return false;
  const t = new Date(ctx.last_updated).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < GROUNDED_CONTEXT_CACHE_MS;
}

export function parseGroundedContextUnknown(raw: unknown): GroundedContextV1 | null {
  const r = groundedContextSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Normalize model output + stamp fingerprint and server time after validation. */
export function finalizeGroundedContext(
  raw: unknown,
  fingerprint: string
): GroundedContextV1 | null {
  const now = new Date().toISOString();
  if (!isRecord(raw)) return null;
  const merged: Record<string, unknown> = {
    ...raw,
    last_updated: now,
    search_fingerprint: fingerprint,
  };
  return parseGroundedContextUnknown(merged);
}

/** Compact digest for mentor prompts — structured only, capped length. */
export function formatGroundedContextForPrompt(ctx: GroundedContextV1 | null | undefined): string {
  if (!ctx?.last_updated) return "";
  const uni = ctx.universities
    .slice(0, 14)
    .map((u) => {
      const fit = u.fit_reason?.trim() ? ` · fit: ${u.fit_reason.slice(0, 160)}` : "";
      const prob = u.admission_probability?.trim()
        ? ` · admission_band: ${u.admission_probability}`
        : "";
      return `- [${u.tier}] ${u.name} (${u.country})${prob}${fit} · fees: ${u.fees}`;
    })
    .join("\n");
  const jm = ctx.job_market;
  const jobBlock = [
    `roles: ${jm.roles.slice(0, 12).join("; ")}`,
    `salary_range: ${jm.salary_range}`,
    `skills: ${jm.skills.slice(0, 14).join("; ")}`,
    `companies: ${jm.companies.slice(0, 12).join("; ")}`,
  ].join("\n");
  const ins = ctx.student_insights
    .slice(0, 6)
    .map((s) => `- ${s.title}: ${s.summary}`)
    .join("\n");
  const body = [
    `last_updated: ${ctx.last_updated}`,
    "UNIVERSITIES (tiered to this profile):",
    uni || "(none)",
    "JOB_MARKET (role-specific):",
    jobBlock,
    "STUDENT_REALITY:",
    ins || "(none)",
  ].join("\n\n");
  return body.length > 6000 ? `${body.slice(0, 5900)}…` : body;
}

export function emptyGroundedContextPlaceholder(isoNow: string): GroundedContextV1 {
  return {
    universities: [],
    job_market: { ...EMPTY_GROUNDED_JOB_MARKET },
    student_insights: [],
    last_updated: isoNow,
  };
}

/**
 * Build one Gemini prompt that encodes profile-specific search intent per country
 * (universities, job market, student reality). No generic study-abroad queries.
 */
export function buildGroundedSearchUserPrompt(signals: ProfileSignals): string {
  const countryBlocks = signals.countries
    .map((country) => {
      return `
### Country: ${country}
Use Google Search to research ONLY material relevant to this student profile:
- Field of study: ${signals.field}
- Degree intent: ${signals.degree_type || "graduate program"}
- Academic band: ${signals.cgpa_band} (numeric CGPA context: ${signals.cgpa} / 10 scale)
- Target career role: ${signals.role}

You must address these three research tracks for ${country} (no generic "top universities abroad"):
(1) UNIVERSITIES — List universities in ${country} suited to ${signals.field} students at ${signals.cgpa_band}. For EACH university output: fit_reason (why it matches this profile), gaps (what this student may lack vs typical admits), actions_to_improve (concrete next steps), admission_probability (qualitative band, not a guarantee), plus acceptance_rate, requirements, fees, timeline; tier as safe | moderate | ambitious **for this profile** (ranked / actionable, not generic prestige lists).
(2) JOB MARKET — For role "${signals.role}" in ${country}: career path, salary bands (ranges as strings), hiring demand, entry vs mid roles, skills employers emphasize, notable hiring companies.
(3) STUDENT REALITY — Authentic challenges for ${signals.field} students in ${country}: visa/cost/job outlook themes grounded in search results.

`;
    })
    .join("\n");

  return `You are compiling structured orientation data for ONE student. Every sentence must be tied to their field (${signals.field}), countries (${signals.countries.join(
    ", "
  )}), CGPA band (${signals.cgpa_band}), and target role (${signals.role}). Do not answer with generic worldwide rankings unrelated to this profile.

${countryBlocks}

Aggregate job_market across the listed countries into ONE summary object (roles, salary_range, skills, companies) that stays specific to "${signals.role}" and these destinations.

Respond with a single JSON object ONLY (no markdown) matching this schema:
{
  "universities": [
    {
      "name": string,
      "country": string,
      "tier": "safe" | "moderate" | "ambitious",
      "fit_reason": string,
      "gaps": string[],
      "actions_to_improve": string[],
      "admission_probability": string,
      "acceptance_rate": string,
      "requirements": string[],
      "fees": string,
      "timeline": string
    }
  ],
  "job_market": {
    "roles": string[],
    "salary_range": string,
    "skills": string[],
    "companies": string[]
  },
  "student_insights": [ { "title": string, "summary": string } ],
  "last_updated": "<ISO-8601 timestamp>"
}
Cap universities at 24 total across all countries; keep strings concise; use empty arrays if search yields nothing credible.`;
}

export const GROUNDED_SEARCH_SYSTEM = `You are a research synthesizer. You must use Google Search grounding when available. Output ONLY valid JSON as specified — no markdown fences, no commentary, no long prose fields. Each field must be short, factual, and explicitly tied to the student's field, destination countries, CGPA band, and target role. If uncertain, use shorter conservative statements rather than invention.`;
