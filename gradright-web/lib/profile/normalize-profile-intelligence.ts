import type {
  ClarityLevel,
  ProfileIntelligence,
  ProfileIntelligenceExtracurricular,
  ProfileIntelligenceGoals,
  ProfileIntelligenceResume,
} from "@/lib/profile/profile-intelligence-types";
import {
  EMPTY_EXTRACURRICULAR,
  emptyProfileIntelligence,
} from "@/lib/profile/profile-intelligence-types";

const RESUME_TOP_KEYS = new Set([
  "cgpa",
  "internships",
  "projects",
  "research_papers",
  "skills",
  "extracurricular",
]);

const GOALS_TOP_KEYS = new Set([
  "five_year_goal",
  "target_role",
  "domain",
  "clarity",
  "clarity_level",
]);

function trimStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => String(x).trim())
    .filter(Boolean);
}

function toNumberCgpa(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

/** Map free text / legacy values to strict clarity enum. */
export function toClarityLevel(v: unknown): ClarityLevel {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "high" || s === "h") return "high";
  if (s === "medium" || s === "med" || s === "moderate" || s === "mid") return "medium";
  if (s === "low" || s === "l") return "low";
  if (/\bhigh\b|\bstrong\b|\bvery clear\b|\bexplicit\b/.test(s)) return "high";
  if (/\bmedium\b|\bmoderate\b|\bpartial\b|\bsome\b/.test(s)) return "medium";
  if (/\blow\b|\bvague\b|\bunclear\b|\buncertain\b/.test(s)) return "low";
  if (s.length >= 48) return "high";
  if (s.length >= 16) return "medium";
  return "low";
}

/**
 * Safe JSON object from model output: handles string bodies and invalid JSON.
 * Never throws. Does not log raw content.
 */
export function coerceUnknownToJsonObject(data: unknown): Record<string, unknown> {
  if (data === null || data === undefined) return {};
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return {};
    try {
      const parsed: unknown = JSON.parse(
        trimmed.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "")
      );
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>) };
  }
  return {};
}

/** Heuristic: place free-text lines into extracurricular buckets. */
function classifyExtracurricular(
  raw: unknown
): ProfileIntelligenceExtracurricular {
  const out: ProfileIntelligenceExtracurricular = { ...EMPTY_EXTRACURRICULAR };

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    for (const k of Object.keys(EMPTY_EXTRACURRICULAR) as Array<
      keyof ProfileIntelligenceExtracurricular
    >) {
      out[k] = trimStrings(o[k]);
    }
    return out;
  }

  const lines = trimStrings(raw);
  for (const line of lines) {
    const t = line.toLowerCase();
    if (
      /\b(nss|ngo|volunteer|community service|social work)\b/.test(t) ||
      /\b(public service)\b/.test(t)
    ) {
      out.public_service.push(line);
    } else if (
      /\b(captain|president|vice president|head|lead|chair|founder|leadership)\b/.test(t)
    ) {
      out.leadership.push(line);
    } else if (
      /\b(sport|athletic|marathon|cricket|football|basketball|tennis)\b/.test(t)
    ) {
      out.sports.push(line);
    } else if (/\b(hackathon|hackfest|mlh|devfolio)\b/.test(t)) {
      out.hackathons.push(line);
    } else {
      out.achievements.push(line);
    }
  }
  return out;
}

export function normalizeResumeIntelligence(raw: unknown): ProfileIntelligenceResume {
  const base = emptyProfileIntelligence().resume;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;

  const extracurricular = classifyExtracurricular(o.extracurricular);

  return {
    cgpa: toNumberCgpa(o.cgpa),
    internships: trimStrings(o.internships),
    projects: trimStrings(o.projects),
    research_papers: trimStrings(o.research_papers),
    skills: trimStrings(o.skills),
    extracurricular,
  };
}

export function normalizeGoalsIntelligence(raw: unknown): ProfileIntelligenceGoals {
  const base = emptyProfileIntelligence().goals;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const clarityRaw = o.clarity ?? o.clarity_level;
  return {
    five_year_goal: String(o.five_year_goal ?? "").trim(),
    target_role: String(o.target_role ?? "").trim(),
    domain: String(o.domain ?? "").trim(),
    clarity: toClarityLevel(clarityRaw),
  };
}

/**
 * Coerces input into a strict `ProfileIntelligence` (full `resume` + `goals`).
 * Use after merge or when you already have both sections; for partial DB/API updates
 * prefer `mergeProfileIntelligence` with a patch.
 */
export function normalizeProfileIntelligence(input: unknown): ProfileIntelligence {
  if (input === null || input === undefined || typeof input !== "object" || Array.isArray(input)) {
    return emptyProfileIntelligence();
  }
  const o = input as Record<string, unknown>;

  const nestedResume =
    o.resume !== undefined && typeof o.resume === "object" && o.resume !== null && !Array.isArray(o.resume)
      ? normalizeResumeIntelligence(o.resume)
      : undefined;
  const nestedGoals =
    o.goals !== undefined && typeof o.goals === "object" && o.goals !== null && !Array.isArray(o.goals)
      ? normalizeGoalsIntelligence(o.goals)
      : undefined;

  if (nestedResume !== undefined && nestedGoals !== undefined) {
    return finalizeProfileIntelligence({ resume: nestedResume, goals: nestedGoals });
  }
  if (nestedResume !== undefined) {
    return finalizeProfileIntelligence({ resume: nestedResume });
  }
  if (nestedGoals !== undefined) {
    return finalizeProfileIntelligence({ goals: nestedGoals });
  }

  return splitFlatAndNormalize(o);
}

function splitFlatAndNormalize(flat: Record<string, unknown>): ProfileIntelligence {
  const resumePick: Record<string, unknown> = {};
  const goalsPick: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (RESUME_TOP_KEYS.has(k)) resumePick[k] = v;
    if (GOALS_TOP_KEYS.has(k)) goalsPick[k] = v;
  }
  const hasR = Object.keys(resumePick).length > 0;
  const hasG = Object.keys(goalsPick).length > 0;
  if (!hasR && !hasG) return emptyProfileIntelligence();
  return finalizeProfileIntelligence({
    resume: hasR ? normalizeResumeIntelligence(resumePick) : undefined,
    goals: hasG ? normalizeGoalsIntelligence(goalsPick) : undefined,
  });
}

/** After normalization, ensure numeric CGPA, non-null arrays, and clarity enum. */
export function finalizeProfileIntelligence(
  partial: Partial<ProfileIntelligence> & {
    resume?: Partial<ProfileIntelligenceResume>;
    goals?: Partial<ProfileIntelligenceGoals>;
  }
): ProfileIntelligence {
  const empty = emptyProfileIntelligence();
  const resume: ProfileIntelligenceResume = {
    ...empty.resume,
    ...partial.resume,
    extracurricular: {
      ...EMPTY_EXTRACURRICULAR,
      ...empty.resume.extracurricular,
      ...partial.resume?.extracurricular,
    },
  };
  resume.cgpa = toNumberCgpa(resume.cgpa);
  resume.internships = trimStrings(resume.internships);
  resume.projects = trimStrings(resume.projects);
  resume.research_papers = trimStrings(resume.research_papers);
  resume.skills = trimStrings(resume.skills);
  for (const k of Object.keys(EMPTY_EXTRACURRICULAR) as Array<
    keyof ProfileIntelligenceExtracurricular
  >) {
    resume.extracurricular[k] = trimStrings(resume.extracurricular[k]);
  }

  const gMerged = { ...empty.goals, ...partial.goals };
  const goalsPartial = partial.goals as Record<string, unknown> | undefined;
  const claritySource =
    gMerged.clarity ??
    (goalsPartial && "clarity_level" in goalsPartial
      ? goalsPartial.clarity_level
      : undefined);
  const goals: ProfileIntelligenceGoals = {
    five_year_goal: String(gMerged.five_year_goal ?? "").trim(),
    target_role: String(gMerged.target_role ?? "").trim(),
    domain: String(gMerged.domain ?? "").trim(),
    clarity: toClarityLevel(claritySource),
  };

  return { resume, goals };
}

/** Last pass before Supabase `updateUser` — idempotent strict shape. */
export function validateProfileIntelligenceForSave(
  pi: ProfileIntelligence
): ProfileIntelligence {
  return finalizeProfileIntelligence(pi);
}

export function mergeProfileIntelligence(
  prev: unknown,
  patch: Partial<ProfileIntelligence>
): ProfileIntelligence {
  const empty = emptyProfileIntelligence();
  const base =
    prev && typeof prev === "object" && !Array.isArray(prev)
      ? finalizeProfileIntelligence(prev as Partial<ProfileIntelligence>)
      : empty;

  const resume =
    patch.resume !== undefined
      ? normalizeResumeIntelligence(patch.resume)
      : base.resume;
  const goals =
    patch.goals !== undefined ? normalizeGoalsIntelligence(patch.goals) : base.goals;

  return finalizeProfileIntelligence({ resume, goals });
}
