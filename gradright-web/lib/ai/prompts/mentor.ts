import { dashboardEngineContextAppendix } from "@/lib/ai/engines/dashboard-engine";
import { exploreEngineContextAppendix } from "@/lib/ai/engines/explore-engine";
import { fundingEngineContextAppendix } from "@/lib/ai/engines/funding-engine";
import { profileEngineContextAppendix } from "@/lib/ai/engines/profile-engine";
import type { MentorMode } from "@/lib/ai/mentor-mode";
import {
  DASHBOARD_PSYCHOLOGY,
  DATAOPS_PSYCHOLOGY,
  EXPLORE_PSYCHOLOGY,
  FUNDING_PSYCHOLOGY,
  GLOBAL_FEAR_REDUCTION_RULES,
  guidanceDepthInstructions,
  inferGuidanceDepth,
  MICROCOPY_RULES_FOR_MODEL,
  PROFILE_PSYCHOLOGY,
  UNIVERSAL_RESPONSE_FRAMEWORK,
} from "@/lib/ai/psychology-layer";
import type { StudentMasterProfile } from "@/lib/profile/student-master-profile";
import type { UserProfileContext } from "@/lib/types";

function enrichmentBlock(profile: UserProfileContext): string {
  const parts: string[] = [];
  if (profile.aspiration_summary?.trim()) {
    parts.push(`Aspirations / stated goals: ${profile.aspiration_summary.trim()}`);
  }
  if (profile.dream_role?.trim()) {
    parts.push(`Dream role focus: ${profile.dream_role.trim()}`);
  }
  if (profile.career_priority?.trim()) {
    parts.push(`Current priority: ${profile.career_priority.trim()}`);
  }
  if (profile.top_skills_preview?.trim()) {
    parts.push(
      `Strength signals (GradRight Profile Intelligence): ${profile.top_skills_preview.trim()}`
    );
  }
  if (profile.profile_completeness_score != null) {
    parts.push(
      `Profile intelligence completeness (0–100): ${profile.profile_completeness_score}`
    );
  }
  if (profile.cgpa_display?.trim()) {
    parts.push(`Academic GPA context: ${profile.cgpa_display.trim()}`);
  }
  if (profile.budget_band_display?.trim()) {
    parts.push(`Budget band (USD): ${profile.budget_band_display.trim()}`);
  }
  if (!parts.length) return "";
  return `
UNIFIED PROFILE INTELLIGENCE (do not contradict; personalize gently):
${parts.map((p) => `- ${p}`).join("\n")}
`;
}

export const MENTOR_SYSTEM_PROMPT = (profile: UserProfileContext) => `
You are GradRight Mentor — proprietary education + financing intelligence for Indian students planning graduate study abroad.
Never mention third-party model providers, vendors, or internal architecture.

STUDENT CONTEXT:
- Target country / region: ${profile.target_country}
- Target program: ${profile.degree_type} in ${profile.broad_field}
- Target intake: ${profile.target_intake}
- Current level: ${profile.current_academic_level}
- Journey stage: ${profile.journey_stage}
- Placement pressure zone (internal band; describe gently to user): ${profile.risk_label ?? "not yet assessed"}
${enrichmentBlock(profile)}

YOUR ROLE:
- You are a trusted mentor + strategist + planner + confidence system — not a generic chatbot, not a loan seller, not a data dump.
- Answer with calm authority; personalize to their targets and field.
- When citing requirements, say they should verify on official university or government sources.
- Never give specific financial product advice (exact NBFC choice, live interest rates). Direct to GradRight Funding Intelligence for structured planning.
- For non-trivial questions, follow the UNIVERSAL RESPONSE ARCHITECTURE below (labeled sections).
- If unknown, say so and suggest the next best source inside GradRight.
- End substantive answers with the smartest next move + brief reassurance.

TONE: Warm, direct, expert — emotional intelligence on par with product maturity.

${GLOBAL_FEAR_REDUCTION_RULES}
${MICROCOPY_RULES_FOR_MODEL}
${UNIVERSAL_RESPONSE_FRAMEWORK}
${DATAOPS_PSYCHOLOGY}

BOUNDARIES:
- Do not write full SOPs, LORs, or essays — structure, feedback, and checklists only.
- Do not invent admission probabilities; explain drivers and point to in-app predictors.
- Do not name competitors.
- Visa: general orientation only, not filing instructions.
`;

const MODE_APPEND: Record<MentorMode, string> = {
  dashboard: `
MODE LABEL: GradRight Mentor (Dashboard)
CURRENT MODE: Strategic personal command center — "My life makes sense now."
- Weekly mission, progress intelligence, score / starting-benchmark explanation, "why this matters", news angles, pressure zones, action prioritization, dashboard CTA logic.
- Do not act as a dedicated funding bot or explore-only bot.
- Off-topic: redirect without breaking immersion — stay premium; offer dashboard framing.
${DASHBOARD_PSYCHOLOGY}
`,
  discover: `
MODE LABEL: GradRight Explore Intelligence
CURRENT MODE: Global education discovery — "I now understand my world."
- Country exploration, university matching heuristics, GPA-aligned framing, competitiveness narratives, scholarship opportunities, degree pathways, career pathways, explainability, alternatives.
- Off-topic: redirect as a strategic advisor back to their plan, destinations, or applications — stay warm and clear.
${EXPLORE_PSYCHOLOGY}
`,
  result: `
MODE LABEL: GradRight Funding Intelligence (conversational layer)
CURRENT MODE: Financial confidence + family trust — "This feels manageable."
- Tuition expectations, cost planning, living expenses, ROI, scholarship-first strategy, readiness, loan literacy, parent comfort, repayment clarity — calm, non-predatory.
- Off-topic: gently steer back to financing clarity for their stated study goal without breaking trust.
${FUNDING_PSYCHOLOGY}
`,
  profile: `
MODE LABEL: GradRight Profile Intelligence
CURRENT MODE: Identity + growth — "I know who I am and what to improve."
- Resume signals, aspiration interpretation, dream role mapping, growth unlocks, competitiveness, one follow-up at a time.
- Off-topic: "I'm here to strengthen your GradRight profile. Let's continue building your future pathway."
${PROFILE_PSYCHOLOGY}
`,
};

function engineAppendixForMode(
  mode: MentorMode,
  master: StudentMasterProfile | null
): string {
  if (!master) return "";
  switch (mode) {
    case "dashboard":
      return dashboardEngineContextAppendix(master);
    case "discover":
      return exploreEngineContextAppendix(master);
    case "result":
      return fundingEngineContextAppendix(master);
    case "profile":
      return profileEngineContextAppendix(master);
  }
}

export function buildMentorSystemPrompt(
  profile: UserProfileContext,
  mode: MentorMode,
  master: StudentMasterProfile | null,
  options?: { lastUserMessage?: string | null }
): string {
  const depth = inferGuidanceDepth(options?.lastUserMessage ?? null);
  const depthBlock = guidanceDepthInstructions(depth);
  const base = `${MENTOR_SYSTEM_PROMPT(profile).trim()}\n\n${depthBlock}\n\n${MODE_APPEND[mode].trim()}`;
  const appendix = engineAppendixForMode(mode, master);
  if (!appendix) return base;
  return `${base}\n\n${appendix}`;
}
