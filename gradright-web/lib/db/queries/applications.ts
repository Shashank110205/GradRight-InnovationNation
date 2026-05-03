import { db } from "@/lib/db/client";
import {
  loan_applications,
  risk_scores,
  student_profiles,
  user_events,
  users,
} from "@/lib/db/schema";
import {
  classifyProgramType,
  NBFC_PROGRAM_TYPES,
  normalizeInstituteTier,
  parseNbfcProgramTypeParam,
  type NBFCInstituteTier,
  type NBFCProgramType,
} from "@/lib/nbfc/cohort-utils";
import { signLoanDocuments } from "@/lib/nbfc/sign-loan-docs";
import type { SignedDocumentItem } from "@/lib/nbfc/sign-loan-docs";
import { getRiskScoreById } from "@/lib/db/queries/risk_scores";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import type {
  LoanApplication,
  LoanApplicationStatus,
  NBFCApplicationListItem,
  NBFCFilters,
  NBFCDecision,
  NBFCPortfolioData,
  RiskLabel,
  RiskScore,
  StudentProfile,
} from "@/lib/types";
import { and, desc, eq, ilike, inArray, ne, or } from "drizzle-orm";

const DOCUMENT_TARGETS_FOR_COMPLETENESS = 6;

function toDec(
  v: number | null | undefined
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return String(v);
}

function mapLoanRow(row: typeof loan_applications.$inferSelect): LoanApplication {
  return {
    id: row.id,
    user_id: row.user_id,
    risk_score_id: row.risk_score_id ?? null,
    status: row.status,
    step_completed: row.step_completed ?? -1,
    full_name: row.full_name,
    dob: row.dob ?? null,
    pan_number: row.pan_number,
    aadhaar_last4: row.aadhaar_last4,
    address: row.address,
    institute: row.institute,
    program: row.program,
    admission_confirmed: row.admission_confirmed ?? false,
    offer_letter_url: row.offer_letter_url,
    loan_amount_requested: row.loan_amount_requested
      ? Number(row.loan_amount_requested)
      : null,
    co_borrower_name: row.co_borrower_name,
    co_borrower_relation: row.co_borrower_relation,
    collateral_available: row.collateral_available ?? false,
    family_income_annual: row.family_income_annual
      ? Number(row.family_income_annual)
      : null,
    documents: row.documents ?? [],
    ocr_extracted_data: (row.ocr_extracted_data as Record<
      string,
      unknown
    > | null) ?? null,
    nbfc_supervisor_id: row.nbfc_supervisor_id ?? null,
    nbfc_notes: row.nbfc_notes,
    nbfc_decision_at: row.nbfc_decision_at ?? null,
    submitted_at: row.submitted_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function loanPatchFromPartial(
  stepData: Partial<LoanApplication>
): Partial<typeof loan_applications.$inferInsert> {
  const patch: Partial<typeof loan_applications.$inferInsert> = {};

  if (stepData.risk_score_id !== undefined) {
    patch.risk_score_id = stepData.risk_score_id;
  }
  if (stepData.status !== undefined) patch.status = stepData.status;
  if (stepData.step_completed !== undefined) {
    patch.step_completed = stepData.step_completed;
  }
  if (stepData.full_name !== undefined) patch.full_name = stepData.full_name;
  if (stepData.dob !== undefined) patch.dob = stepData.dob;
  if (stepData.pan_number !== undefined) patch.pan_number = stepData.pan_number;
  if (stepData.aadhaar_last4 !== undefined) {
    patch.aadhaar_last4 = stepData.aadhaar_last4;
  }
  if (stepData.address !== undefined) patch.address = stepData.address;
  if (stepData.institute !== undefined) patch.institute = stepData.institute;
  if (stepData.program !== undefined) patch.program = stepData.program;
  if (stepData.admission_confirmed !== undefined) {
    patch.admission_confirmed = stepData.admission_confirmed;
  }
  if (stepData.offer_letter_url !== undefined) {
    patch.offer_letter_url = stepData.offer_letter_url;
  }
  if (stepData.loan_amount_requested !== undefined) {
    patch.loan_amount_requested = toDec(stepData.loan_amount_requested);
  }
  if (stepData.co_borrower_name !== undefined) {
    patch.co_borrower_name = stepData.co_borrower_name;
  }
  if (stepData.co_borrower_relation !== undefined) {
    patch.co_borrower_relation = stepData.co_borrower_relation;
  }
  if (stepData.collateral_available !== undefined) {
    patch.collateral_available = stepData.collateral_available;
  }
  if (stepData.family_income_annual !== undefined) {
    patch.family_income_annual = toDec(stepData.family_income_annual);
  }
  if (stepData.documents !== undefined) patch.documents = stepData.documents;
  if (stepData.ocr_extracted_data !== undefined) {
    patch.ocr_extracted_data = stepData.ocr_extracted_data;
  }
  if (stepData.nbfc_supervisor_id !== undefined) {
    patch.nbfc_supervisor_id = stepData.nbfc_supervisor_id;
  }
  if (stepData.nbfc_notes !== undefined) patch.nbfc_notes = stepData.nbfc_notes;
  if (stepData.nbfc_decision_at !== undefined) {
    patch.nbfc_decision_at = stepData.nbfc_decision_at;
  }
  if (stepData.submitted_at !== undefined) {
    patch.submitted_at = stepData.submitted_at;
  }

  return patch;
}

export async function getLoanApplicationByUserId(
  userId: string
): Promise<LoanApplication | null> {
  try {
    const rows = await db
      .select()
      .from(loan_applications)
      .where(eq(loan_applications.user_id, userId))
      .orderBy(desc(loan_applications.created_at))
      .limit(1);

    const row = rows[0];
    return row ? mapLoanRow(row) : null;
  } catch (error) {
    console.error("[getLoanApplicationByUserId]", error);
    throw error;
  }
}

export async function upsertLoanApplicationStep(
  userId: string,
  stepData: Partial<LoanApplication>
): Promise<LoanApplication> {
  try {
    const existing = await getLoanApplicationByUserId(userId);
    const patch = loanPatchFromPartial(stepData);
    const now = new Date().toISOString();

    if (!existing) {
      const insertValues: typeof loan_applications.$inferInsert = {
        user_id: userId,
        ...patch,
        updated_at: now,
      };
      const inserted = await db
        .insert(loan_applications)
        .values(insertValues)
        .returning();

      const row = inserted[0];
      if (!row) throw new Error("Insert loan application failed");
      return mapLoanRow(row);
    }

    const updated = await db
      .update(loan_applications)
      .set({
        ...patch,
        updated_at: now,
      })
      .where(eq(loan_applications.id, existing.id))
      .returning();

    const row = updated[0];
    if (!row) throw new Error("Update loan application failed");
    return mapLoanRow(row);
  } catch (error) {
    console.error("[upsertLoanApplicationStep]", error);
    throw error;
  }
}

export async function getLoanApplicationById(
  id: string
): Promise<LoanApplication | null> {
  try {
    const rows = await db
      .select()
      .from(loan_applications)
      .where(eq(loan_applications.id, id))
      .limit(1);
    const row = rows[0];
    return row ? mapLoanRow(row) : null;
  } catch (error) {
    console.error("[getLoanApplicationById]", error);
    throw error;
  }
}

export interface NBFCApplicationDetailPayload {
  application: LoanApplication;
  risk_score: RiskScore | null;
  student_profile: StudentProfile | null;
  documents: SignedDocumentItem[];
}

export async function getNBFCApplicationDetailForSupervisor(
  id: string
): Promise<NBFCApplicationDetailPayload | null> {
  const application = await getLoanApplicationById(id);
  if (!application || application.status === "draft") {
    return null;
  }

  const [risk_score, student_profile] = await Promise.all([
    application.risk_score_id
      ? getRiskScoreById(application.risk_score_id)
      : Promise.resolve(null),
    getStudentProfileByUserId(application.user_id),
  ]);

  const documents = await signLoanDocuments(application.documents ?? []);

  return {
    application,
    risk_score,
    student_profile,
    documents,
  };
}

export async function submitLoanApplication(
  applicationId: string
): Promise<LoanApplication> {
  try {
    const now = new Date().toISOString();
    const updated = await db
      .update(loan_applications)
      .set({
        status: "submitted",
        submitted_at: now,
        updated_at: now,
      })
      .where(eq(loan_applications.id, applicationId))
      .returning();

    const row = updated[0];
    if (!row) {
      throw new Error(`Loan application not found: ${applicationId}`);
    }
    return mapLoanRow(row);
  } catch (error) {
    console.error("[submitLoanApplication]", error);
    throw error;
  }
}

function normalizeStatusFilter(
  f?: LoanApplicationStatus | LoanApplicationStatus[]
): LoanApplicationStatus[] | undefined {
  if (f === undefined) return undefined;
  return Array.isArray(f) ? f : [f];
}

function normalizeRiskFilter(
  f?: RiskLabel | RiskLabel[]
): RiskLabel[] | undefined {
  if (f === undefined) return undefined;
  return Array.isArray(f) ? f : [f];
}

export async function getNBFCApplications(
  filters: NBFCFilters = {}
): Promise<NBFCApplicationListItem[]> {
  try {
    const {
      status: statusFilter,
      risk_label: riskFilter,
      target_country: countryFilter,
      program_type: programTypeFilter,
      search,
      limit = 100,
      offset = 0,
      includeDrafts = false,
    } = filters;

    const statuses = normalizeStatusFilter(statusFilter);
    const risks = normalizeRiskFilter(riskFilter);
    const rawProgram = programTypeFilter?.trim();
    const programBucket: NBFCProgramType | undefined = rawProgram
      ? parseNbfcProgramTypeParam(rawProgram) ??
        (NBFC_PROGRAM_TYPES.includes(rawProgram as NBFCProgramType)
          ? (rawProgram as NBFCProgramType)
          : undefined)
      : undefined;

    const conditions = [];

    if (!includeDrafts && !statuses?.length) {
      conditions.push(ne(loan_applications.status, "draft"));
    }
    if (statuses?.length) {
      conditions.push(inArray(loan_applications.status, statuses));
    }
    if (risks?.length) {
      conditions.push(inArray(risk_scores.risk_label, risks));
    }
    if (countryFilter?.trim()) {
      const q = `%${countryFilter.trim()}%`;
      conditions.push(ilike(student_profiles.target_country, q));
    }
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(loan_applications.full_name, q),
          ilike(users.full_name, q),
          ilike(loan_applications.institute, q),
          ilike(loan_applications.program, q)
        )!
      );
    }

    const baseQuery = db
      .select({
        id: loan_applications.id,
        appFullName: loan_applications.full_name,
        userFullName: users.full_name,
        institute: loan_applications.institute,
        program: loan_applications.program,
        target_country: student_profiles.target_country,
        risk_label: risk_scores.risk_label,
        placement_prob_6m: risk_scores.placement_prob_6m,
        salary_band_low_lpa: risk_scores.salary_band_low_lpa,
        salary_band_high_lpa: risk_scores.salary_band_high_lpa,
        loan_amount_requested: loan_applications.loan_amount_requested,
        status: loan_applications.status,
        submitted_at: loan_applications.submitted_at,
        documents: loan_applications.documents,
      })
      .from(loan_applications)
      .innerJoin(users, eq(loan_applications.user_id, users.id))
      .leftJoin(
        student_profiles,
        eq(student_profiles.user_id, users.id)
      )
      .leftJoin(
        risk_scores,
        eq(loan_applications.risk_score_id, risk_scores.id)
      );

    const filteredQuery =
      conditions.length > 0
        ? baseQuery.where(and(...conditions))
        : baseQuery;

    const fetchLimit = programBucket ? Math.min(2000, limit + offset + 500) : limit;
    const rows = await filteredQuery
      .orderBy(
        desc(loan_applications.submitted_at),
        desc(loan_applications.updated_at)
      )
      .limit(fetchLimit)
      .offset(programBucket ? 0 : offset);

    let mapped: NBFCApplicationListItem[] = rows.map((r) => {
      const docs = r.documents ?? [];
      const completeness = Math.min(
        100,
        Math.round((docs.length / DOCUMENT_TARGETS_FOR_COMPLETENESS) * 100)
      );

      return {
        id: r.id,
        applicant_name: r.appFullName ?? r.userFullName ?? "Unknown",
        institute: r.institute ?? "",
        program: r.program ?? "",
        target_country: r.target_country ?? "",
        risk_label: (r.risk_label ?? "medium") as RiskLabel,
        placement_prob_6m: r.placement_prob_6m
          ? Number(r.placement_prob_6m)
          : 0,
        salary_band_low_lpa: r.salary_band_low_lpa
          ? Number(r.salary_band_low_lpa)
          : 0,
        salary_band_high_lpa: r.salary_band_high_lpa
          ? Number(r.salary_band_high_lpa)
          : 0,
        loan_amount_requested: r.loan_amount_requested
          ? Number(r.loan_amount_requested)
          : 0,
        status: r.status,
        submitted_at: r.submitted_at ?? "",
        document_completeness_pct: completeness,
      };
    });

    if (programBucket) {
      mapped = rows
        .filter((r) => classifyProgramType(r.program) === programBucket)
        .map((r) => {
          const docs = r.documents ?? [];
          const completeness = Math.min(
            100,
            Math.round((docs.length / DOCUMENT_TARGETS_FOR_COMPLETENESS) * 100)
          );
          return {
            id: r.id,
            applicant_name: r.appFullName ?? r.userFullName ?? "Unknown",
            institute: r.institute ?? "",
            program: r.program ?? "",
            target_country: r.target_country ?? "",
            risk_label: (r.risk_label ?? "medium") as RiskLabel,
            placement_prob_6m: r.placement_prob_6m
              ? Number(r.placement_prob_6m)
              : 0,
            salary_band_low_lpa: r.salary_band_low_lpa
              ? Number(r.salary_band_low_lpa)
              : 0,
            salary_band_high_lpa: r.salary_band_high_lpa
              ? Number(r.salary_band_high_lpa)
              : 0,
            loan_amount_requested: r.loan_amount_requested
              ? Number(r.loan_amount_requested)
              : 0,
            status: r.status,
            submitted_at: r.submitted_at ?? "",
            document_completeness_pct: completeness,
          };
        });
      mapped = mapped.slice(offset, offset + limit);
    }

    return mapped;
  } catch (error) {
    console.error("[getNBFCApplications]", error);
    throw error;
  }
}

export async function updateApplicationDecision(
  id: string,
  decision: NBFCDecision,
  supervisorUserId: string,
  notes?: string | null
): Promise<LoanApplication | null> {
  try {
    const existingRows = await db
      .select({ user_id: loan_applications.user_id })
      .from(loan_applications)
      .where(eq(loan_applications.id, id))
      .limit(1);
    const applicantUserId = existingRows[0]?.user_id;
    if (!applicantUserId) {
      return null;
    }

    const now = new Date().toISOString();
    let status: LoanApplicationStatus;

    switch (decision) {
      case "approved":
        status = "approved";
        break;
      case "rejected":
        status = "rejected";
        break;
      case "manual_review":
        status = "manual_review";
        break;
      default: {
        const _exhaustive: never = decision;
        throw new Error(`Unknown decision: ${_exhaustive}`);
      }
    }

    const updated = await db
      .update(loan_applications)
      .set({
        status,
        nbfc_supervisor_id: supervisorUserId,
        nbfc_notes: notes?.trim() ? notes.trim() : null,
        nbfc_decision_at: now,
        updated_at: now,
      })
      .where(eq(loan_applications.id, id))
      .returning();

    const row = updated[0];
    if (!row) {
      return null;
    }

    await db.insert(user_events).values({
      user_id: supervisorUserId,
      event_type: "nbfc_application_decision",
      event_data: {
        loan_application_id: id,
        decision,
        notes: notes?.trim() ?? null,
        applicant_user_id: applicantUserId,
      },
      updated_at: now,
    });

    return mapLoanRow(row);
  } catch (error) {
    console.error("[updateApplicationDecision]", error);
    throw error;
  }
}

export async function getNBFCPortfolioData(): Promise<NBFCPortfolioData> {
  const rows = await db
    .select({
      status: loan_applications.status,
      risk_label: risk_scores.risk_label,
      program: loan_applications.program,
      loanInstitute: loan_applications.institute,
      profileTier: student_profiles.institute_tier,
      profileInstitute: student_profiles.institute_name,
      risk_score_raw: risk_scores.risk_score_raw,
      placement_prob_6m: risk_scores.placement_prob_6m,
    })
    .from(loan_applications)
    .innerJoin(users, eq(loan_applications.user_id, users.id))
    .leftJoin(student_profiles, eq(student_profiles.user_id, users.id))
    .leftJoin(
      risk_scores,
      eq(loan_applications.risk_score_id, risk_scores.id)
    )
    .where(ne(loan_applications.status, "draft"));

  let total_applications = 0;
  let pending_review = 0;
  let approved = 0;
  let rejected = 0;
  const risk_distribution = { low: 0, medium: 0, high: 0 };

  type HeatKey = string;
  const heatAccum = new Map<
    HeatKey,
    { sumScore: number; sumPlc: number; count: number }
  >();

  for (const r of rows) {
    total_applications += 1;
    if (
      r.status === "submitted" ||
      r.status === "under_review" ||
      r.status === "manual_review"
    ) {
      pending_review += 1;
    }
    if (r.status === "approved") approved += 1;
    if (r.status === "rejected") rejected += 1;

    const lbl = r.risk_label;
    if (lbl === "low" || lbl === "medium" || lbl === "high") {
      risk_distribution[lbl] += 1;
    }

    const prog = classifyProgramType(r.program);
    const tier = normalizeInstituteTier(
      r.profileTier,
      r.profileInstitute,
      r.loanInstitute
    );
    const key: HeatKey = `${prog}::${tier}`;
    const score = r.risk_score_raw != null ? Number(r.risk_score_raw) : 0;
    const plc = r.placement_prob_6m != null ? Number(r.placement_prob_6m) : 0;
    const prev = heatAccum.get(key) ?? { sumScore: 0, sumPlc: 0, count: 0 };
    heatAccum.set(key, {
      sumScore: prev.sumScore + score,
      sumPlc: prev.sumPlc + plc,
      count: prev.count + 1,
    });
  }

  const decided = approved + rejected;
  const approval_rate = decided > 0 ? approved / decided : 0;

  const cohort_heatmap = Array.from(heatAccum.entries()).map(([key, v]) => {
    const sep = key.indexOf("::");
    const program_type = (sep === -1 ? "Other" : key.slice(0, sep)) as NBFCProgramType;
    const institute_tier = (sep === -1
      ? "Other"
      : key.slice(sep + 2)) as NBFCInstituteTier;
    return {
      program_type,
      institute_tier,
      avg_risk_score: v.count ? v.sumScore / v.count : 0,
      application_count: v.count,
      avg_placement_prob_6m: v.count ? v.sumPlc / v.count : 0,
    };
  });

  return {
    total_applications,
    pending_review,
    approval_rate,
    risk_distribution,
    cohort_heatmap,
  };
}
