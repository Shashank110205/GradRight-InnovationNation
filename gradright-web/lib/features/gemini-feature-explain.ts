import { safeGenerate } from "@/lib/ai/orchestrator";
import { getGeminiApiKey } from "@/lib/ai/env";
import type { ScoringResult } from "@/lib/decision/types";
import {
  formatGroundedContextForPrompt,
  type GroundedContextV1,
} from "@/lib/profile/grounded-context";
import { getProfileHubFromUserMetadata } from "@/lib/profile/user-profile-hub";

/** Short dashboard hero copy — Gemini only, grounded in scorer output JSON. */
export async function explainHomeShortWithGemini(
  scoring: ScoringResult
): Promise<{ text: string; source: "gemini" | "unavailable" }> {
  if (!getGeminiApiKey()) {
    return {
      text: "Add GEMINI_API_KEY to enable a short AI summary. Scores and university rows above are already live from your profile hub and the risk engine.",
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
    text: "You have a live GradScore and ranked programs from your latest profile hub snapshot.",
    source: "unavailable",
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** One-screen summary: targets, goals, career — always included in mentor prompts. */
export function mentorStudentSummary(meta: Record<string, unknown>): string {
  const hub = getProfileHubFromUserMetadata(meta);
  const rawAnswers = hub.onboarding && isRecord(hub.onboarding) ? hub.onboarding.answers : undefined;
  const answers = isRecord(rawAnswers) ? rawAnswers : {};
  const pi = isRecord(meta.profile_intelligence) ? meta.profile_intelligence : {};
  const goalsRaw = isRecord(pi.goals) ? pi.goals : hub.goals_snapshot;
  const goals = isRecord(goalsRaw) ? goalsRaw : {};
  const resume =
    isRecord(pi.resume) ? pi.resume : hub.resume_snapshot && isRecord(hub.resume_snapshot)
      ? hub.resume_snapshot
      : null;
  const rMeta =
    resume && isRecord(resume) ? (resume as Record<string, unknown>) : null;

  return [
    "=== STUDENT_PROFILE_SUMMARY (authoritative) ===",
    `Target countries: ${typeof answers.target_country === "string" ? answers.target_country : "(add in onboarding)"}`,
    `Broad field: ${typeof answers.broad_field === "string" ? answers.broad_field : typeof goals.domain === "string" ? goals.domain : "(add)"}`,
    `Degree intent: ${typeof answers.degree_type === "string" ? answers.degree_type : "(add)"}`,
    `Career interest / target role: ${typeof goals.target_role === "string" ? goals.target_role : "(add goals)"}`,
    `Five-year goal: ${typeof goals.five_year_goal === "string" ? goals.five_year_goal.slice(0, 400) : "(add)"}`,
    `Budget band: ${typeof answers.budget_band_usd === "string" ? answers.budget_band_usd : "(unknown)"}`,
    `CGPA (résumé): ${typeof rMeta?.cgpa === "number" ? rMeta.cgpa : "—"} / ${
      typeof rMeta?.cgpa_scale === "number" ? rMeta.cgpa_scale : 10
    }`,
  ].join("\n");
}

export async function explainMentorReplyWithGemini(input: {
  userMessage: string;
  meta: Record<string, unknown>;
  grounded: GroundedContextV1 | null;
}): Promise<{ response: string; source: "gemini" | "unavailable" }> {
  if (!getGeminiApiKey()) {
    return {
      response:
        "I can help when GEMINI_API_KEY is configured. Your profile hub data is still saved — try again after setup.",
      source: "unavailable",
    };
  }

  const gcBlock = formatGroundedContextForPrompt(input.grounded);
  const summary = mentorStudentSummary(input.meta);
  const pi = input.meta.profile_intelligence;
  const piStr =
    pi && typeof pi === "object"
      ? JSON.stringify(pi).slice(0, 8000)
      : "(none)";

  const r = await safeGenerate({
    module: "feature-mentor",
    systemInstruction:
      "You are GradRight's AI mentor. Ground every suggestion in STUDENT_PROFILE_SUMMARY and GROUNDED_CONTEXT. Use PROFILE_INTELLIGENCE_JSON for detail. Never invent visa rules, deadlines, or admission guarantees. Be warm and specific. Answer the student's latest message directly.",
    userPrompt: `${summary}\n\nGROUNDED_CONTEXT_BLOCK:\n${gcBlock || "(refresh Explore orientation if empty)"}\n\nPROFILE_INTELLIGENCE_JSON:\n${piStr}\n\nSTUDENT_MESSAGE:\n${input.userMessage.slice(0, 8000)}`,
    maxTokens: 2048,
    temperature: 0.4,
    expectJson: false,
  });

  if (r.ok && typeof r.data === "string" && r.data.trim()) {
    return { response: r.data.trim(), source: "gemini" };
  }
  return {
    response: "I could not generate a reply right now. Please try again in a moment.",
    source: "unavailable",
  };
}

/** When job_market is thin, produce a short personalized labor-market paragraph from profile only. */
export async function enrichCareerNarrativeFromProfile(
  meta: Record<string, unknown>
): Promise<string | null> {
  if (!getGeminiApiKey()) return null;
  const summary = mentorStudentSummary(meta);
  const r = await safeGenerate({
    module: "feature-career-enrich",
    systemInstruction:
      "Write 3–4 sentences on realistic roles and skill demand for this student's targets. No invented salary numbers; speak in ranges only if grounded elsewhere. If information is missing, say exactly what to add to profile intelligence.",
    userPrompt: summary,
    maxTokens: 400,
    temperature: 0.35,
    expectJson: false,
  });
  if (r.ok && typeof r.data === "string" && r.data.trim()) return r.data.trim();
  return null;
}

/** Personalized funding literacy tied to destinations + budget + orientation fees. */
export async function enrichFinancialLiteracyNarrative(input: {
  meta: Record<string, unknown>;
  feesDigest: string;
  roiHint: string;
}): Promise<string | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-fin-lit",
    systemInstruction:
      "Explain EMI vs moratorium, FX risk, and proof-of-funds in plain English for this student's countries and budget. Tie to the fee digest; no fake interest rates.",
    userPrompt: `${mentorStudentSummary(input.meta)}\n\nFEES_DIGEST:\n${input.feesDigest.slice(0, 6000)}\n\nROI_HINT:\n${input.roiHint}`,
    maxTokens: 700,
    temperature: 0.35,
    expectJson: false,
  });
  if (r.ok && typeof r.data === "string" && r.data.trim()) return r.data.trim();
  return null;
}

/** Fill discover insights when orientation returned none — profile-grounded only. */
export async function enrichDiscoverInsightsWhenEmpty(
  meta: Record<string, unknown>
): Promise<Array<{ title: string; summary: string }> | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-discover-enrich",
    systemInstruction:
      'Return ONLY JSON { "insights": [ { "title": string, "summary": string } ] } with exactly 3 items on visa realism, costs, and employability for this student\'s stated destinations — no URLs.',
    userPrompt: mentorStudentSummary(meta),
    maxTokens: 600,
    temperature: 0.35,
    expectJson: true,
  });
  if (!r.ok || typeof r.data !== "object" || r.data === null) return null;
  const ins = (r.data as { insights?: unknown }).insights;
  if (!Array.isArray(ins)) return null;
  const out: Array<{ title: string; summary: string }> = [];
  for (const x of ins) {
    if (!isRecord(x)) continue;
    const title = typeof x.title === "string" ? x.title : "";
    const summary = typeof x.summary === "string" ? x.summary : "";
    if (title && summary) out.push({ title, summary });
  }
  return out.length ? out.slice(0, 5) : null;
}

/** Scholarship cards + deadlines narrative grounded in orientation text. */
export async function enrichScholarshipStrategyNarrative(input: {
  meta: Record<string, unknown>;
  hints: string[];
  timelines: string[];
}): Promise<{ strategy: string; items: Array<{ title: string; eligibility: string; deadline_hint: string }> } | null> {
  if (!getGeminiApiKey()) return null;
  const r = await safeGenerate({
    module: "feature-scholarship-enrich",
    systemInstruction: `Return ONLY valid JSON: { "strategy": string, "items": [ { "title": string, "eligibility": string, "deadline_hint": string } ] } with 3–5 items max. Base titles on merit/need/assistantship patterns for this student's field and destinations. If unknown, say what to verify on program sites.`,
    userPrompt: `${mentorStudentSummary(input.meta)}\n\nHINTS:\n${input.hints.join("\n")}\n\nTIMELINES:\n${input.timelines.join("\n")}`,
    maxTokens: 900,
    temperature: 0.3,
    expectJson: true,
  });
  if (!r.ok || typeof r.data !== "object" || r.data === null) return null;
  const o = r.data as Record<string, unknown>;
  const strategy = typeof o.strategy === "string" ? o.strategy : "";
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items = itemsRaw
    .filter((x): x is Record<string, unknown> => isRecord(x))
    .map((x) => ({
      title: typeof x.title === "string" ? x.title : "Scholarship track",
      eligibility: typeof x.eligibility === "string" ? x.eligibility : "",
      deadline_hint: typeof x.deadline_hint === "string" ? x.deadline_hint : "",
    }))
    .slice(0, 5);
  if (!strategy && !items.length) return null;
  return { strategy, items };
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
        "GRE guidance needs GEMINI_API_KEY. Add your target programs in profile intelligence so we can tailor verbal/quant targets once AI is on.",
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
