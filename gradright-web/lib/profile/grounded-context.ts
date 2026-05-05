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

/** Short structured facts from COL / visa searches (parameterized queries). */
export const groundedTopicRowSchema = z.object({
  topic: z.string().max(400),
  detail: z.string().max(1200),
});

export const groundedContextSchema = z.object({
  universities: z.array(groundedUniversityRowSchema).max(36),
  job_market: groundedJobMarketSchema,
  student_insights: z.array(groundedStudentInsightSchema).max(20),
  cost_data: z.array(groundedTopicRowSchema).max(24).default([]),
  visa_data: z.array(groundedTopicRowSchema).max(24).default([]),
  last_updated: z.string(),
  /** Hash of profile signals; regeneration when profile changes. */
  search_fingerprint: z.string().max(128).optional(),
});

export type GroundedUniversityRow = z.infer<typeof groundedUniversityRowSchema>;
export type GroundedJobMarket = z.infer<typeof groundedJobMarketSchema>;
export type GroundedStudentInsight = z.infer<typeof groundedStudentInsightSchema>;
export type GroundedTopicRow = z.infer<typeof groundedTopicRowSchema>;
export type GroundedContextV1 = z.infer<typeof groundedContextSchema>;

/** Max successful grounded searches per user (stored in profile_hub.system). */
export const MAX_GROUNDED_SEARCHES_PER_USER = 3;

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
  const parsed = parseGroundedContextUnknown(merged);
  return parsed;
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
  const cost = (ctx.cost_data ?? [])
    .slice(0, 8)
    .map((r) => `- ${r.topic}: ${r.detail}`)
    .join("\n");
  const visa = (ctx.visa_data ?? [])
    .slice(0, 8)
    .map((r) => `- ${r.topic}: ${r.detail}`)
    .join("\n");
  const body = [
    `last_updated: ${ctx.last_updated}`,
    "UNIVERSITIES (tiered to this profile):",
    uni || "(none)",
    "JOB_MARKET (role-specific):",
    jobBlock,
    "COST_OF_LIVING:",
    cost || "(none)",
    "VISA_ADMISSION:",
    visa || "(none)",
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
    cost_data: [],
    visa_data: [],
    last_updated: isoNow,
  };
}

/**
 * Build one research prompt: parameterized search templates per country + field + CGPA band + role.
 */
export function buildGroundedSearchUserPrompt(signals: ProfileSignals): string {
  const year = new Date().getFullYear();
  const countryBlocks = signals.countries
    .map((country) => {
      const uniQ = `best universities for ${signals.field} in ${country} for students with CGPA ${signals.cgpa_band} admission requirements acceptance rate tuition fees`;
      const jobQ = `${signals.role} jobs in ${country} salary demand skills required ${year} job outlook`;
      const costQ = `cost of living for students in ${country} monthly expenses rent tuition total cost for ${signals.field}`;
      const visaQ = `student visa process ${country} requirements processing time international students ${signals.field}`;
      const insightQ = `student experience studying ${signals.field} in ${country} pros cons job placement outcomes`;

      return `
### Country: ${country}
Run searches aligned to these exact intents (derive facts into JSON fields below):
- UNIVERSITIES :: "${uniQ}"
- JOB_MARKET :: "${jobQ}"
- COST :: "${costQ}"
- VISA :: "${visaQ}"
- STUDENT_INSIGHTS :: "${insightQ}"

Profile anchors (keep everything tied to these): field=${signals.field}; degree=${signals.degree_type || "graduate"}; CGPA band=${signals.cgpa_band} (numeric ${signals.cgpa}/10); target_role=${signals.role}.

For UNIVERSITIES in ${country}: tier safe|moderate|ambitious for this profile; fit_reason, gaps, actions_to_improve, admission_probability (qualitative), acceptance_rate, requirements, fees, timeline.
For JOB MARKET (aggregate across countries later): stay specific to "${signals.role}" in ${country}.
For COST_DATA: array of { topic, detail } from the COST query (rent, food, tuition stressors).
For VISA_DATA: array of { topic, detail } from the VISA query (processing, funds, timeline).
For STUDENT_INSIGHTS: title + summary from STUDENT_INSIGHTS query.

`;
    })
    .join("\n");

  return `You are compiling structured orientation data for ONE student. Every field must map to their field (${signals.field}), destinations (${signals.countries.join(
    ", "
  )}), CGPA band (${signals.cgpa_band}), and target role (${signals.role}). No generic worldwide prestige lists.

${countryBlocks}

Aggregate job_market across countries into ONE object (roles, salary_range, skills, companies) specific to "${signals.role}" and these destinations.

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
  "cost_data": [ { "topic": string, "detail": string } ],
  "visa_data": [ { "topic": string, "detail": string } ],
  "last_updated": "<ISO-8601 timestamp>"
}
Cap universities at 24 total; cap cost_data and visa_data at 12 entries each; use empty arrays if nothing credible.`;
}

export const GROUNDED_SEARCH_SYSTEM = `You are a research synthesizer. You must use Google Search grounding when available. Output ONLY valid JSON as specified — no markdown fences, no commentary, no long prose fields. Each field must be short, factual, and explicitly tied to the student's field, destination countries, CGPA band, and target role. If uncertain, use shorter conservative statements rather than invention.`;
