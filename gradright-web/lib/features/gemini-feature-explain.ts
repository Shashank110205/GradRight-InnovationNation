import { safeGenerate } from "@/lib/ai/orchestrator";
import { getGeminiApiKey } from "@/lib/ai/env";
import type { ScoringResult } from "@/lib/decision/types";
import {
  formatGroundedContextForPrompt,
  type GroundedContextV1,
} from "@/lib/profile/grounded-context";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Concise narrative for mentor prompts — onboarding + goals + targets (hub truth). */
export function buildMentorProfileSummary(meta: Record<string, unknown>): string {
  const hub = getProfileHubFromUserMetadata(meta);
  const answers =
    hub.onboarding?.answers && isRecord(hub.onboarding.answers)
      ? hub.onboarding.answers
      : {};
  const target_country =
    typeof answers.target_country === "string" ? answers.target_country.trim() : "";
  const broad_field =
    typeof answers.broad_field === "string" ? answers.broad_field.trim() : "";
  const degree_type =
    typeof answers.degree_type === "string" ? answers.degree_type.trim() : "";
  const budget =
    typeof answers.budget_band_usd === "string" ? answers.budget_band_usd.trim() : "";

  const pi = meta.profile_intelligence;
  let goalsLine = "";
  if (isRecord(pi) && isRecord(pi.goals)) {
    const g = pi.goals as Record<string, unknown>;
    const parts = [g.target_role, g.domain, g.five_year_goal]
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim());
    goalsLine = parts.join(" · ");
  }

  return [
    `Target countries: ${target_country || "(add in onboarding)"}.`,
    `Field: ${broad_field || "(add)"}. Degree intent: ${degree_type || "(add)"}.`,
    `Budget band (self-reported): ${budget || "(add)"}.`,
    `Goals / career direction: ${goalsLine || "(add in profile intelligence)"}.`,
  ].join("\n");
}

/** Short dashboard hero copy — Gemini only, grounded in scorer output JSON. */
export async function explainHomeShortWithGemini(
  scoring: ScoringResult
): Promise<{ text: string; source: "gemini" | "unavailable" }> {
  if (!getGeminiApiKey()) {
    return {
      text: "Your GradScore and ranked programs reflect your latest saved profile. Enrich goals under Profile coach for sharper headline guidance.",
      source: "unavailable",
    };
  }

  const top = scoring.universities.slice(0, 4).map((u) => ({
    name: u.name,
    final_score: u.final_score,
    tier: u.tier,
  }));

  const r = await safeGenerate({
    module: "feature-home-short",
    systemInstruction:
      "You are GradRight. Write 2–3 short sentences for a student dashboard. Be warm and clear. Use ONLY facts implied by the JSON. No cohort or internal jargon. No invented stats.",
    userPrompt: `Summarize the headline story: GradScore ${scoring.grad_score}, top schools ${JSON.stringify(top)}, ROI summary ${JSON.stringify(scoring.roi)}, meta ${JSON.stringify(scoring.meta)}. Mention one clear next action if improvement_areas exist: ${JSON.stringify(scoring.readiness.improvement_areas?.slice(0, 2) ?? [])}.`,
    maxTokens: 400,
    temperature: 0.35,
    expectJson: false,
  });

  if (r.ok && typeof r.data === "string" && r.data.trim()) {
    return { text: r.data.trim(), source: "gemini" };
  }
  return {
    text: "You have a live GradScore and ranked programs from your latest saved profile.",
    source: "unavailable",
  };
}

export async function explainMentorReplyWithGemini(input: {
  userMessage: string;
  meta: Record<string, unknown>;
  grounded: GroundedContextV1 | null;
}): Promise<{ text: string; source: "gemini" | "unavailable" }> {
  if (!getGeminiApiKey()) {
    return {
      text: "Tailored coaching will resume shortly. Your saved profile context is intact — please try again in a moment.",
      source: "unavailable",
    };
  }

  const gcBlock = formatGroundedContextForPrompt(input.grounded);
  const pi = input.meta.profile_intelligence;
  const piStr =
    pi && typeof pi === "object"
      ? JSON.stringify(pi).slice(0, 12000)
      : "(none)";
  const summary = buildMentorProfileSummary(input.meta);

  const r = await safeGenerate({
    module: "feature-mentor",
    systemInstruction:
      "You are GradRight's AI mentor. Advice must align with USER_PROFILE_SUMMARY, PROFILE_INTELLIGENCE_JSON, and GROUNDED_CONTEXT_BLOCK. Reference target countries, field, goals, and career interest explicitly when relevant. No hallucinated deadlines or visa rules; when uncertain, say what to verify and where. Encourage specific next steps.",
    userPrompt: `USER_PROFILE_SUMMARY (authoritative):\n${summary}\n\nGROUNDED_CONTEXT_BLOCK:\n${gcBlock || "(empty)"}\n\nPROFILE_INTELLIGENCE_JSON:\n${piStr}\n\nSTUDENT_MESSAGE:\n${input.userMessage.slice(0, 8000)}`,
    maxTokens: 2048,
    temperature: 0.4,
    expectJson: false,
  });

  if (r.ok && typeof r.data === "string" && r.data.trim()) {
    return { text: r.data.trim(), source: "gemini" };
  }
  return {
    text: "I could not generate a reply right now. Please try again in a moment.",
    source: "unavailable",
  };
}

export async function explainGreEstimateWithGemini(input: {
  meta: Record<string, unknown>;
  requirementsSummary: string;
}): Promise<{
  suggested_score: { verbal?: number; quant?: number; aw?: number };
  reasoning: string;
  source: "gemini" | "unavailable";
}> {
  if (!getGeminiApiKey()) {
    return {
      suggested_score: {},
      reasoning:
        "Add your target programs to profile intelligence so verbal/quant targets can align with stated requirements when guidance is available.",
      source: "unavailable",
    };
  }

  const pi = input.meta.profile_intelligence;
  const resume =
    pi && typeof pi === "object" && "resume" in pi && pi.resume && typeof pi.resume === "object"
      ? (pi.resume as Record<string, unknown>)
      : {};

  const r = await safeGenerate({
    module: "feature-gre",
    systemInstruction: `Return ONLY valid JSON with keys: verbal (number 130-170), quant (number 130-170), aw (number 0-6 optional), reasoning (string, max 800 chars). Base targets on the student's academic band and program requirements text. Do not guarantee admission.`,
    userPrompt: `Resume/academic JSON (subset): ${JSON.stringify({
      cgpa: resume.cgpa,
      scale: resume.cgpa_scale,
      field: resume.field_of_study,
    })}\n\nAggregated program requirements / expectations:\n${input.requirementsSummary.slice(0, 12000)}`,
    maxTokens: 600,
    temperature: 0.25,
    expectJson: true,
  });

  if (!r.ok || typeof r.data !== "object" || r.data === null) {
    return {
      suggested_score: {},
      reasoning: "Could not produce a GRE target right now.",
      source: "unavailable",
    };
  }

  const o = r.data as Record<string, unknown>;
  const verbal = typeof o.verbal === "number" ? Math.round(o.verbal) : undefined;
  const quant = typeof o.quant === "number" ? Math.round(o.quant) : undefined;
  const aw = typeof o.aw === "number" ? Number(o.aw.toFixed(1)) : undefined;
  const reasoning = typeof o.reasoning === "string" ? o.reasoning.slice(0, 800) : "";

  return {
    suggested_score: {
      ...(verbal != null && verbal >= 130 && verbal <= 170 ? { verbal } : {}),
      ...(quant != null && quant >= 130 && quant <= 170 ? { quant } : {}),
      ...(aw != null && aw >= 0 && aw <= 6 ? { aw } : {}),
    },
    reasoning: reasoning || "See profile requirements for typical score bands.",
    source: "gemini",
  };
}

export async function enrichCareerFeatureWithGemini(input: {
  meta: Record<string, unknown>;
  summary: string;
}): Promise<{
  roles: string[];
  salary_range: string;
  demand_trends: string;
  growth_trajectory: string | null;
} | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-career-fill",
    systemInstruction:
      'Return ONLY JSON: { "roles": string[], "salary_range": string, "demand_trends": string, "growth_trajectory": string }. Ground claims in the profile summary; use cautious language.',
    userPrompt: `Student profile summary:\n${input.summary}\n\nInfer realistic career exploration lines for their stated destinations and goals.`,
    maxTokens: 900,
    temperature: 0.35,
    expectJson: true,
  });
  if (!r.ok || !isRecord(r.data)) return null;
  const d = r.data as Record<string, unknown>;
  const roles = Array.isArray(d.roles) ? d.roles.filter((x): x is string => typeof x === "string") : [];
  const salary_range = typeof d.salary_range === "string" ? d.salary_range : "";
  const demand_trends = typeof d.demand_trends === "string" ? d.demand_trends : "";
  const growth_trajectory =
    typeof d.growth_trajectory === "string" ? d.growth_trajectory : null;
  if (!roles.length && !salary_range) return null;
  return { roles, salary_range, demand_trends, growth_trajectory };
}

export async function enrichFinancialLiteracyWithGemini(input: {
  summary: string;
  fees_preview: string;
  roi_hint: string;
}): Promise<{
  personalized_paragraph: string;
  emi_explainer: string;
  roi_takeaway: string;
} | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-fin-lit",
    systemInstruction:
      'Return ONLY JSON: { "personalized_paragraph": string, "emi_explainer": string, "roi_takeaway": string }. Tie advice to this student\'s destinations and budget; no invented loan APR numbers.',
    userPrompt: `Profile:\n${input.summary}\n\nFees context:\n${input.fees_preview}\n\nROI hint:\n${input.roi_hint}`,
    maxTokens: 900,
    temperature: 0.35,
    expectJson: true,
  });
  if (!r.ok || !isRecord(r.data)) return null;
  const d = r.data as Record<string, unknown>;
  const personalized_paragraph =
    typeof d.personalized_paragraph === "string" ? d.personalized_paragraph : "";
  const emi_explainer = typeof d.emi_explainer === "string" ? d.emi_explainer : "";
  const roi_takeaway = typeof d.roi_takeaway === "string" ? d.roi_takeaway : "";
  if (!personalized_paragraph && !emi_explainer) return null;
  return { personalized_paragraph, emi_explainer, roi_takeaway };
}

export type ScholarshipGeminiRow = {
  title: string;
  eligibility: string;
  deadline_hint: string;
  application_tip: string;
};

export async function enrichScholarshipsWithGemini(input: {
  summary: string;
  program_hints: string;
}): Promise<ScholarshipGeminiRow[] | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-scholarships-fill",
    systemInstruction:
      'Return ONLY JSON: { "scholarships": [ { "title": string, "eligibility": string, "deadline_hint": string, "application_tip": string } ] } with 3–5 items. Types: merit, need-based, graduate assistantship patterns appropriate to the profile. Do not invent specific real scholarship names; use descriptive titles like "Merit aid — Engineering (Canada)".',
    userPrompt: `Student:\n${input.summary}\n\nProgram orientation hints:\n${input.program_hints.slice(0, 6000)}`,
    maxTokens: 1200,
    temperature: 0.35,
    expectJson: true,
  });
  if (!r.ok || !isRecord(r.data)) return null;
  const raw = r.data.scholarships;
  if (!Array.isArray(raw)) return null;
  const out: ScholarshipGeminiRow[] = [];
  for (const el of raw) {
    if (!isRecord(el)) continue;
    const title = typeof el.title === "string" ? el.title : "";
    const eligibility = typeof el.eligibility === "string" ? el.eligibility : "";
    const deadline_hint = typeof el.deadline_hint === "string" ? el.deadline_hint : "";
    const application_tip = typeof el.application_tip === "string" ? el.application_tip : "";
    if (title) out.push({ title, eligibility, deadline_hint, application_tip });
  }
  return out.length ? out : null;
}
