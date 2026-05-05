/**
 * Canonical `user_metadata.profile_hub` — one JSON document for AI and services:
 * onboarding snapshot, Gemini résumé chat extraction, profile coach notes, and
 * mirrors of structured goals/résumé from profile-builder (`profile_intelligence`).
 */
import type { GroundedContextV1 } from "@/lib/profile/grounded-context";
import { parseGroundedContextUnknown } from "@/lib/profile/grounded-context";
import type {
  ProfileIntelligenceGoals,
  ProfileIntelligenceResume,
} from "@/lib/profile/profile-intelligence-types";

export const PROFILE_HUB_VERSION = 1 as const;
export const MAX_PROFILE_HUB_COACH_TURNS = 80;
export const MAX_PROFILE_HUB_COACH_TEXT = 8000;

export type ProfileHubOnboarding = {
  submitted_at: string;
  answers: Record<string, unknown>;
};

export type ProfileHubResumeGemini = {
  saved_at: string;
  resume_storage_path: string;
  skills: string[];
  projects: unknown[];
  internships: unknown[];
  estimated_total_experience_years: number | null;
};

export type ProfileHubCoachTurn = {
  at: string;
  kind: string;
  text: string;
};

/** Hub-level UX + cache metadata (not scorer logic). */
export type ProfileHubSystemState = {
  profile_completeness?: number;
  last_updated?: string;
};

export type ProfileHubDecisionCache = {
  fingerprint: string;
  cached_at: string;
  payload: unknown;
};

export type ProfileHubV1 = {
  version: typeof PROFILE_HUB_VERSION;
  updated_at: string;
  onboarding?: ProfileHubOnboarding;
  resume_gemini?: ProfileHubResumeGemini;
  coach_turns?: ProfileHubCoachTurn[];
  /** Mirrors `profile_intelligence.goals` after profile-builder saves. */
  goals_snapshot?: ProfileIntelligenceGoals;
  /** Mirrors `profile_intelligence.resume` after profile-builder saves. */
  resume_snapshot?: ProfileIntelligenceResume;
  /** Search-grounded orientation JSON (Gemini + Google Search); refreshed ≤ daily. */
  grounded_context?: GroundedContextV1;
  system?: ProfileHubSystemState;
  /** Cached `/api/ai/scoring` snapshot — invalidated via fingerprint. */
  decision_cache?: ProfileHubDecisionCache;
};

export type ProfileHubPatch = {
  onboarding?: ProfileHubOnboarding;
  resume_gemini?: ProfileHubResumeGemini;
  goals_snapshot?: ProfileIntelligenceGoals;
  resume_snapshot?: ProfileIntelligenceResume;
  grounded_context?: GroundedContextV1;
  system?: ProfileHubSystemState;
  decision_cache?: ProfileHubDecisionCache | null;
  appendCoachTurn?: { kind: string; text: string };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function coachTurnsFromUnknown(v: unknown): ProfileHubCoachTurn[] {
  if (!Array.isArray(v)) return [];
  const out: ProfileHubCoachTurn[] = [];
  for (const el of v) {
    if (!isRecord(el)) continue;
    const at = typeof el.at === "string" ? el.at : "";
    const kind = typeof el.kind === "string" ? el.kind : "unknown";
    const text = typeof el.text === "string" ? el.text : "";
    if (!at || !text) continue;
    out.push({ at, kind, text: truncate(text, MAX_PROFILE_HUB_COACH_TEXT) });
  }
  return out;
}

/** Parse and coerce stored `profile_hub` into a v1 shape (lossy but safe). */
export function normalizeProfileHub(raw: unknown): ProfileHubV1 {
  const now = new Date().toISOString();
  if (!isRecord(raw)) {
    return { version: PROFILE_HUB_VERSION, updated_at: now };
  }
  const hub: ProfileHubV1 = {
    version: PROFILE_HUB_VERSION,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : now,
  };
  if (isRecord(raw.onboarding)) {
    const submitted_at =
      typeof raw.onboarding.submitted_at === "string"
        ? raw.onboarding.submitted_at
        : "";
    const answers = raw.onboarding.answers;
    if (submitted_at && isRecord(answers)) {
      hub.onboarding = { submitted_at, answers: { ...answers } };
    }
  }
  if (isRecord(raw.resume_gemini)) {
    const saved_at = typeof raw.resume_gemini.saved_at === "string" ? raw.resume_gemini.saved_at : "";
    const resume_storage_path =
      typeof raw.resume_gemini.resume_storage_path === "string"
        ? raw.resume_gemini.resume_storage_path
        : "";
    if (saved_at && resume_storage_path) {
      const skills = Array.isArray(raw.resume_gemini.skills)
        ? raw.resume_gemini.skills.filter((s): s is string => typeof s === "string")
        : [];
      hub.resume_gemini = {
        saved_at,
        resume_storage_path,
        skills,
        projects: Array.isArray(raw.resume_gemini.projects) ? raw.resume_gemini.projects : [],
        internships: Array.isArray(raw.resume_gemini.internships)
          ? raw.resume_gemini.internships
          : [],
        estimated_total_experience_years:
          typeof raw.resume_gemini.estimated_total_experience_years === "number"
            ? raw.resume_gemini.estimated_total_experience_years
            : raw.resume_gemini.estimated_total_experience_years === null
              ? null
              : null,
      };
    }
  }
  const turns = coachTurnsFromUnknown(raw.coach_turns);
  if (turns.length) hub.coach_turns = turns.slice(-MAX_PROFILE_HUB_COACH_TURNS);

  if (isRecord(raw.goals_snapshot)) {
    hub.goals_snapshot = raw.goals_snapshot as ProfileIntelligenceGoals;
  }
  if (isRecord(raw.resume_snapshot)) {
    hub.resume_snapshot = raw.resume_snapshot as ProfileIntelligenceResume;
  }
  const gc = parseGroundedContextUnknown(raw.grounded_context);
  if (gc) hub.grounded_context = gc;

  if (isRecord(raw.system)) {
    const pc = raw.system.profile_completeness;
    hub.system = {
      profile_completeness:
        typeof pc === "number" ? Math.min(100, Math.max(0, pc)) : undefined,
      last_updated:
        typeof raw.system.last_updated === "string"
          ? raw.system.last_updated
          : undefined,
    };
  }

  if (isRecord(raw.decision_cache)) {
    hub.decision_cache = {
      fingerprint:
        typeof raw.decision_cache.fingerprint === "string"
          ? raw.decision_cache.fingerprint
          : "",
      cached_at:
        typeof raw.decision_cache.cached_at === "string"
          ? raw.decision_cache.cached_at
          : "",
      payload: raw.decision_cache.payload,
    };
  }
  return hub;
}

export function getProfileHubFromUserMetadata(
  userMetadata: Record<string, unknown> | null | undefined
): ProfileHubV1 {
  return normalizeProfileHub(userMetadata?.profile_hub);
}

/**
 * Deep-merge style patch into `user_metadata`, preserving unrelated keys.
 * Call after building any other metadata updates (e.g. `profile_intelligence`).
 */
export function applyProfileHubPatch(
  prevUserMetadata: Record<string, unknown>,
  patch: ProfileHubPatch
): Record<string, unknown> {
  const hub = normalizeProfileHub(prevUserMetadata.profile_hub);
  let coach = [...(hub.coach_turns ?? [])];
  if (patch.appendCoachTurn) {
    coach.push({
      at: new Date().toISOString(),
      kind: patch.appendCoachTurn.kind.slice(0, 120),
      text: truncate(patch.appendCoachTurn.text, MAX_PROFILE_HUB_COACH_TEXT),
    });
    if (coach.length > MAX_PROFILE_HUB_COACH_TURNS) {
      coach = coach.slice(-MAX_PROFILE_HUB_COACH_TURNS);
    }
  }

  const nextHub: ProfileHubV1 = {
    ...hub,
    version: PROFILE_HUB_VERSION,
    updated_at: new Date().toISOString(),
    onboarding: patch.onboarding !== undefined ? patch.onboarding : hub.onboarding,
    resume_gemini: patch.resume_gemini !== undefined ? patch.resume_gemini : hub.resume_gemini,
    goals_snapshot: patch.goals_snapshot !== undefined ? patch.goals_snapshot : hub.goals_snapshot,
    resume_snapshot:
      patch.resume_snapshot !== undefined ? patch.resume_snapshot : hub.resume_snapshot,
    grounded_context:
      patch.grounded_context !== undefined ? patch.grounded_context : hub.grounded_context,
    coach_turns: patch.appendCoachTurn ? coach : hub.coach_turns ?? [],
    system: patch.system !== undefined ? patch.system : hub.system,
    decision_cache:
      patch.decision_cache === undefined
        ? hub.decision_cache
        : (patch.decision_cache ?? undefined),
  };

  return { ...prevUserMetadata, profile_hub: nextHub };
}
