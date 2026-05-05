/**
 * C-007: Single merge entry point for student_profiles writes.
 *
 * Source priority (higher wins on scalar conflict): onboarding < resume < risk_form < chatbot
 * - onboarding: only updates the core questionnaire columns it carries; never strips resume/chatbot fields.
 * - resume: merges array fields with dedupe; fills cgpa only when absent unless resume explicitly improves counts.
 * - risk_form: student-confirmed career assessment — overwrites overlapping academic/counters it sends.
 * - chatbot: profile UI + `/api/user/profile-enrich` full save — incoming wins for provided keys.
 */
import type { student_profiles } from "@/lib/db/schema";
import type { OnboardingAnswers, StudentProfile } from "@/lib/types";

export type ProfileMergeSource =
  | "onboarding"
  | "resume"
  | "risk_form"
  | "chatbot";

const ONBOARDING_KEYS = new Set<string>([
  "target_country",
  "target_intake",
  "degree_type",
  "broad_field",
  "current_academic_level",
  "budget_band_usd",
  "loan_needed",
]); // C-005: matches `onboardingAnswersSchema` + `ONBOARDING_QUESTIONS` keys

export type ProfileIncomingPatch = Partial<{
  target_country: string | null;
  target_intake: string | null;
  degree_type: string | null;
  broad_field: string | null;
  current_academic_level: string | null;
  budget_band_usd: string | null;
  loan_needed: boolean;
  work_experience_years: number;
  cgpa: string | null;
  cgpa_scale: string | null;
  internship_months_total: number;
  certification_count: number;
  institute_tier: string | null;
  institute_name: string | null;
  aspiration_text: string | null;
  five_year_goal: string | null;
  dream_role: string | null;
  scholarship_priority: string | null;
  target_universities: string[];
  resume_file_url: string | null;
  parsed_resume_json: Record<string, unknown>;
  extracted_skills: string[];
  extracted_projects: unknown[];
  extracted_internships: unknown[];
  extracted_certifications: unknown[];
  profile_completeness_score: number;
  enrichment_status: string;
  last_enriched_at: string;
  risk_appetite: string | null;
  career_path_clarity: string | null;
  experience_years: number | null;
  funding_value_focus: string | null;
}>;

export type MergeStudentProfileResult = {
  /** Drizzle-ready patch (omit unchanged keys if desired — caller merges into update). */
  values: Partial<typeof student_profiles.$inferInsert>;
  debugLines: string[];
};

function debug(lines: MergeStudentProfileResult["debugLines"], msg: string) {
  lines.push(msg);
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[mergeStudentProfile] ${msg}`);
  }
}

function normSkill(s: string): string {
  return s.trim().toLowerCase();
}

function mergeSkills(
  existing: string[],
  incoming: string[] | undefined,
  lines: string[]
): string[] | undefined {
  if (!incoming) return undefined;
  const map = new Map<string, string>();
  for (const s of existing) {
    const k = normSkill(s);
    if (k) map.set(k, s.trim());
  }
  for (const s of incoming) {
    const k = normSkill(s);
    if (k && !map.has(k)) {
      map.set(k, s.trim());
      debug(lines, `skill+ ${k}`);
    }
  }
  return [...map.values()];
}

function projectKey(p: unknown): string {
  if (p && typeof p === "object" && "title" in p) {
    return String((p as { title?: string }).title ?? "").toLowerCase().trim();
  }
  return JSON.stringify(p);
}

function mergeProjects(
  existing: unknown[],
  incoming: unknown[] | undefined,
  lines: string[]
): unknown[] | undefined {
  if (!incoming) return undefined;
  const map = new Map<string, unknown>();
  for (const p of existing) {
    const k = projectKey(p);
    if (k) map.set(k, p);
  }
  for (const p of incoming) {
    const k = projectKey(p);
    if (k && !map.has(k)) {
      map.set(k, p);
      debug(lines, `project+ ${k.slice(0, 80)}`);
    }
  }
  return [...map.values()];
}

function internshipKey(i: unknown): string {
  if (i && typeof i === "object") {
    const o = i as { org?: string; role?: string; duration?: string };
    return [o.org, o.role, o.duration].map((x) => String(x ?? "").toLowerCase().trim()).join("|");
  }
  return JSON.stringify(i);
}

function mergeInternships(
  existing: unknown[],
  incoming: unknown[] | undefined,
  lines: string[]
): unknown[] | undefined {
  if (!incoming) return undefined;
  const map = new Map<string, unknown>();
  for (const x of existing) {
    const k = internshipKey(x);
    if (k) map.set(k, x);
  }
  for (const x of incoming) {
    const k = internshipKey(x);
    if (k && !map.has(k)) {
      map.set(k, x);
      debug(lines, `internship+ ${k.slice(0, 80)}`);
    }
  }
  return [...map.values()];
}

function certificationKey(c: unknown): string {
  if (c && typeof c === "object") {
    const o = c as { name?: string; issuer?: string; year?: number };
    return `${String(o.name ?? "").toLowerCase()}|${String(o.issuer ?? "").toLowerCase()}|${o.year ?? ""}`;
  }
  return JSON.stringify(c);
}

function mergeCertifications(
  existing: unknown[],
  incoming: unknown[] | undefined,
  lines: string[]
): unknown[] | undefined {
  if (!incoming) return undefined;
  const map = new Map<string, unknown>();
  for (const x of existing) {
    const k = certificationKey(x);
    if (k) map.set(k, x);
  }
  for (const x of incoming) {
    const k = certificationKey(x);
    if (k && !map.has(k)) {
      map.set(k, x);
      debug(lines, `certification+ ${k.slice(0, 80)}`);
    }
  }
  return [...map.values()];
}

function isEmptyScalar(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

function scalarWinner(
  key: string,
  existingVal: unknown,
  incomingVal: unknown,
  source: ProfileMergeSource,
  lines: string[]
): unknown {
  if (incomingVal === undefined) return undefined;
  if (incomingVal === null && source === "chatbot") {
    debug(lines, `${key}: set null (chatbot)`);
    return null;
  }
  if (incomingVal === null) return undefined;
  if (isEmptyScalar(existingVal)) {
    debug(lines, `${key}: fill empty ← ${source}`);
    return incomingVal;
  }
  if (source === "risk_form") {
    debug(lines, `${key}: risk_form overwrite`);
    return incomingVal;
  }
  if (source === "chatbot") {
    debug(lines, `${key}: chatbot overwrite`);
    return incomingVal;
  }
  if (source === "onboarding" && ONBOARDING_KEYS.has(key)) {
    debug(lines, `${key}: onboarding questionnaire authoritative`);
    return incomingVal;
  }
  if (source === "resume") {
    debug(lines, `${key}: keep existing (non-empty; resume arrays handled separately)`);
    return undefined;
  }
  return undefined;
}

function mergeParsedResumeJson(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown> | undefined,
  source: ProfileMergeSource,
  lines: string[]
): Record<string, unknown> | undefined {
  if (!incoming) return undefined;
  const next = { ...existing, ...incoming };
  const prevPe = existing.profile_engine;
  const incPe = incoming.profile_engine;
  if (incPe && typeof incPe === "object") {
    const base =
      prevPe && typeof prevPe === "object"
        ? (prevPe as Record<string, unknown>)
        : {};
    next.profile_engine = {
      ...base,
      ...(incPe as Record<string, unknown>),
    };
    debug(lines, `parsed_resume_json.profile_engine merged (${source})`);
  }
  return next;
}

export function onboardingAnswersToIncomingPatch(
  answers: OnboardingAnswers
): ProfileIncomingPatch {
  return {
    target_country: answers.target_country,
    target_intake: answers.target_intake,
    degree_type: answers.degree_type,
    broad_field: answers.broad_field,
    current_academic_level: answers.current_academic_level,
    budget_band_usd: answers.budget_band_usd,
    loan_needed: answers.loan_needed,
  };
}

/**
 * Merges `incoming` into `existing` according to C-007 rules and returns Drizzle `values` for update/insert.
 */
export function mergeStudentProfile(input: {
  existing: StudentProfile | null;
  incoming: ProfileIncomingPatch;
  source: ProfileMergeSource;
}): MergeStudentProfileResult {
  const lines: string[] = [];
  const { existing, incoming, source } = input;
  debug(lines, `start merge source=${source} hasExisting=${Boolean(existing)}`);

  const out: Partial<typeof student_profiles.$inferInsert> = {};

  const takeScalar = (
    key: keyof ProfileIncomingPatch & string,
    existingVal: unknown,
    incomingVal: unknown,
    toDb?: (v: unknown) => unknown
  ) => {
    const w = scalarWinner(key, existingVal, incomingVal, source, lines);
    if (w !== undefined) {
      (out as Record<string, unknown>)[key] = toDb ? toDb(w) : w;
    }
  };

  takeScalar("target_country", existing?.target_country, incoming.target_country);
  takeScalar("target_intake", existing?.target_intake, incoming.target_intake);
  takeScalar("degree_type", existing?.degree_type, incoming.degree_type);
  takeScalar("broad_field", existing?.broad_field, incoming.broad_field);
  takeScalar(
    "current_academic_level",
    existing?.current_academic_level,
    incoming.current_academic_level
  );
  takeScalar("budget_band_usd", existing?.budget_band_usd, incoming.budget_band_usd);
  if (incoming.loan_needed !== undefined && source === "onboarding") {
    out.loan_needed = incoming.loan_needed;
    debug(lines, "loan_needed: onboarding");
  } else if (incoming.loan_needed !== undefined && source === "chatbot") {
    out.loan_needed = incoming.loan_needed;
    debug(lines, "loan_needed: chatbot");
  }

  takeScalar(
    "aspiration_text",
    existing?.aspiration_text,
    incoming.aspiration_text
  );
  takeScalar("five_year_goal", existing?.five_year_goal, incoming.five_year_goal);
  takeScalar("dream_role", existing?.dream_role, incoming.dream_role);
  takeScalar(
    "scholarship_priority",
    existing?.scholarship_priority,
    incoming.scholarship_priority
  );
  takeScalar("risk_appetite", existing?.risk_appetite, incoming.risk_appetite);
  takeScalar(
    "career_path_clarity",
    existing?.career_path_clarity,
    incoming.career_path_clarity
  );
  takeScalar(
    "funding_value_focus",
    existing?.funding_value_focus,
    incoming.funding_value_focus
  );
  takeScalar("institute_tier", existing?.institute_tier, incoming.institute_tier);
  takeScalar("institute_name", existing?.institute_name, incoming.institute_name);
  takeScalar("resume_file_url", existing?.resume_file_url, incoming.resume_file_url);

  if (incoming.work_experience_years !== undefined) {
    const w = scalarWinner(
      "work_experience_years",
      existing?.work_experience_years,
      incoming.work_experience_years,
      source,
      lines
    );
    if (w !== undefined) out.work_experience_years = w as number;
  }

  if (incoming.cgpa !== undefined) {
    const w = scalarWinner(
      "cgpa",
      existing?.cgpa,
      incoming.cgpa,
      source,
      lines
    );
    if (w !== undefined) out.cgpa = incoming.cgpa ?? undefined;
  }
  if (incoming.cgpa_scale !== undefined) {
    const w = scalarWinner(
      "cgpa_scale",
      existing?.cgpa_scale,
      incoming.cgpa_scale,
      source,
      lines
    );
    if (w !== undefined) out.cgpa_scale = incoming.cgpa_scale ?? undefined;
  }

  if (incoming.internship_months_total !== undefined) {
    const w = scalarWinner(
      "internship_months_total",
      existing?.internship_months_total,
      incoming.internship_months_total,
      source,
      lines
    );
    if (w !== undefined) out.internship_months_total = w as number;
  }

  if (incoming.certification_count !== undefined) {
    const w = scalarWinner(
      "certification_count",
      existing?.certification_count,
      incoming.certification_count,
      source,
      lines
    );
    if (w !== undefined) out.certification_count = w as number;
  }

  if (incoming.experience_years !== undefined) {
    const w = scalarWinner(
      "experience_years",
      existing?.experience_years,
      incoming.experience_years,
      source,
      lines
    );
    if (w !== undefined) out.experience_years = w as number;
  }

  if (incoming.target_universities !== undefined) {
    if (source === "chatbot" || source === "risk_form") {
      out.target_universities = incoming.target_universities;
      debug(lines, "target_universities: replaced (high-trust source)");
    }
  }

  const exSkills = existing?.extracted_skills ?? [];
  if (incoming.extracted_skills !== undefined) {
    if (source === "resume") {
      const merged = mergeSkills(exSkills, incoming.extracted_skills, lines);
      if (merged) out.extracted_skills = merged;
    } else if (source === "chatbot") {
      out.extracted_skills = incoming.extracted_skills;
      debug(lines, "extracted_skills: chatbot replace");
    }
  }

  const exProj = existing?.extracted_projects ?? [];
  if (incoming.extracted_projects !== undefined) {
    if (source === "resume") {
      const merged = mergeProjects(exProj, incoming.extracted_projects, lines);
      if (merged) out.extracted_projects = merged;
    } else if (source === "chatbot") {
      out.extracted_projects = incoming.extracted_projects;
    }
  }

  const exInt = existing?.extracted_internships ?? [];
  if (incoming.extracted_internships !== undefined) {
    if (source === "resume") {
      const merged = mergeInternships(exInt, incoming.extracted_internships, lines);
      if (merged) out.extracted_internships = merged;
    } else if (source === "chatbot") {
      out.extracted_internships = incoming.extracted_internships;
    }
  }

  if (incoming.extracted_certifications !== undefined) {
    const exCert = Array.isArray(
      (existing?.parsed_resume_json as Record<string, unknown> | undefined)
        ?.extracted_certifications
    )
      ? ((existing!.parsed_resume_json as Record<string, unknown>)
          .extracted_certifications as unknown[])
      : [];
    if (source === "resume") {
      const merged = mergeCertifications(
        exCert,
        incoming.extracted_certifications,
        lines
      );
      if (merged) {
        const baseJson = { ...(existing?.parsed_resume_json ?? {}) };
        baseJson.extracted_certifications = merged;
        out.parsed_resume_json = mergeParsedResumeJson(
          baseJson,
          incoming.parsed_resume_json,
          source,
          lines
        ) as typeof out.parsed_resume_json;
      }
    } else if (source === "chatbot") {
      const baseJson = { ...(existing?.parsed_resume_json ?? {}) };
      baseJson.extracted_certifications = incoming.extracted_certifications;
      out.parsed_resume_json = mergeParsedResumeJson(
        baseJson,
        incoming.parsed_resume_json,
        source,
        lines
        ) as typeof out.parsed_resume_json;
    }
  } else if (incoming.parsed_resume_json !== undefined) {
    const merged = mergeParsedResumeJson(
      (existing?.parsed_resume_json ?? {}) as Record<string, unknown>,
      incoming.parsed_resume_json,
      source,
      lines
    );
    if (merged) out.parsed_resume_json = merged as typeof out.parsed_resume_json;
  }

  if (incoming.profile_completeness_score !== undefined) {
    const w = scalarWinner(
      "profile_completeness_score",
      existing?.profile_completeness_score,
      incoming.profile_completeness_score,
      source,
      lines
    );
    if (w !== undefined) out.profile_completeness_score = w as number;
  }
  if (incoming.enrichment_status !== undefined) {
    const w = scalarWinner(
      "enrichment_status",
      existing?.enrichment_status,
      incoming.enrichment_status,
      source,
      lines
    );
    if (w !== undefined) out.enrichment_status = w as string;
  }
  if (incoming.last_enriched_at !== undefined) {
    out.last_enriched_at = incoming.last_enriched_at;
    debug(lines, "last_enriched_at set");
  }

  return { values: out, debugLines: lines };
}
