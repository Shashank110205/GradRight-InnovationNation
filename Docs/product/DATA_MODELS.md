# GradRight — Data Models + TypeScript Types
# File: lib/types/index.ts — copy this entire block into that file.
# These are the canonical types. All components, APIs, and stores must use these.

```typescript
// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export type UserRole = 'student' | 'nbfc_supervisor' | 'admin';

export type JourneyStage = 'discover' | 'plan' | 'finance' | 'apply' | 'succeed';

export type RiskLabel = 'low' | 'medium' | 'high';

export type LoanApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'manual_review';

export type AdmitBand = 'low' | 'medium' | 'high';

export type NudgeChannel = 'email' | 'push' | 'in_app';

export type DocumentType =
  | 'marksheet'
  | 'offer_letter'
  | 'income_proof'
  | 'pan'
  | 'aadhaar'
  | 'bank_statement'
  | 'gre_scorecard'
  | 'ielts_toefl_scorecard';

// ═══════════════════════════════════════════════════════════════
// USER + PROFILE
// ═══════════════════════════════════════════════════════════════

export interface User {
  id: string;
  supabase_uid: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  consent_given: boolean;
  consent_timestamp: string | null;
  onboarding_complete: boolean;
  journey_stage: JourneyStage;
  xp_points: number;
  streak_days: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  // Onboarding
  target_country: string | null;
  target_intake: string | null;
  degree_type: string | null;
  broad_field: string | null;
  current_academic_level: string | null;
  work_experience_years: number;
  loan_needed: boolean;
  budget_band_usd: string | null;
  // Detailed academic profile
  institute_name: string | null;
  institute_tier: 'IIT/IIM' | 'NIT/Tier2' | 'Other' | null;
  cgpa: number | null;
  cgpa_scale: number;
  internship_count: number;
  internship_months_total: number;
  certification_count: number;
  target_universities: string[];
  gre_score: number | null;
  ielts_score: number | null;
  toefl_score: number | null;
  parent_contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingAnswers {
  target_country: string;
  degree_type: string;
  broad_field: string;
  target_intake: string;
  current_academic_level: string;
  budget_band_usd: string;
  loan_needed: boolean;
}

// ═══════════════════════════════════════════════════════════════
// RISK + CAREER
// ═══════════════════════════════════════════════════════════════

export interface RiskDriver {
  factor: string;
  direction: 'positive' | 'negative' | 'neutral';
  weight: number;    // 0.0 – 1.0
  explanation: string;
}

export interface NextBestAction {
  action: string;
  impact: 'high' | 'medium';
  resource_url: string | null;
}

export interface RiskScore {
  id: string;
  user_id: string;
  input_snapshot: Record<string, unknown>;
  placement_prob_3m: number;
  placement_prob_6m: number;
  placement_prob_12m: number;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  risk_label: RiskLabel;
  risk_score_raw: number;
  top_drivers: RiskDriver[];
  next_best_actions: NextBestAction[];
  ai_summary: string | null;
  model_version: string;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// ADMISSION PREDICTOR
// ═══════════════════════════════════════════════════════════════

export interface AdmissionPredictionInput {
  cgpa: number;
  cgpa_scale: number;
  gre_score?: number;
  ielts_score?: number;
  work_experience_years: number;
  target_universities: string[];
  target_country: string;
  degree_type: string;
}

export interface UniversityAdmissionResult {
  university: string;
  tier: string;
  admission_prob: number;     // 0.0 – 1.0
  admit_band: AdmitBand;
  explanation: string;
  // For context in prompts
  student_cgpa_normalized: number;
  gre_score: number | null;
  work_experience_years: number;
}

export interface AdmissionPredictionResult {
  university_results: UniversityAdmissionResult[];
  safer_alternatives: string[];
  ambitious_alternatives: string[];
  key_profile_notes: string[];
}

// ═══════════════════════════════════════════════════════════════
// EMI + FINANCING
// ═══════════════════════════════════════════════════════════════

export interface EMIComfortZone {
  emi_monthly: number;
  emi_pct_at_low_salary: number;
  emi_pct_at_high_salary: number;
  comfort_label: 'comfortable' | 'moderate' | 'high_stress';
}

export interface LoanEligibilityEstimate {
  eligibility_band: 'likely' | 'moderate' | 'unlikely';
  max_recommended_loan: number;    // INR
  comfort_emi_range: { low: number; high: number };
  income_to_emi_ratio: number;
}

// ═══════════════════════════════════════════════════════════════
// LOAN APPLICATION
// ═══════════════════════════════════════════════════════════════

export interface DocumentRecord {
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  uploaded_at: string;
  ocr_status: 'pending' | 'extracted' | 'failed';
  extracted_fields: Record<string, unknown> | null;
}

export interface LoanApplication {
  id: string;
  user_id: string;
  risk_score_id: string | null;
  status: LoanApplicationStatus;
  step_completed: number;
  // Personal
  full_name: string | null;
  dob: string | null;
  pan_number: string | null;
  aadhaar_last4: string | null;
  address: string | null;
  // Academic
  institute: string | null;
  program: string | null;
  admission_confirmed: boolean;
  offer_letter_url: string | null;
  // Financial
  loan_amount_requested: number | null;
  co_borrower_name: string | null;
  co_borrower_relation: string | null;
  collateral_available: boolean;
  family_income_annual: number | null;
  // Documents + OCR
  documents: DocumentRecord[];
  ocr_extracted_data: Record<string, unknown> | null;
  // NBFC
  nbfc_supervisor_id: string | null;
  nbfc_notes: string | null;
  nbfc_decision_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════════════════════════

export type GamificationAction =
  | 'onboarding_complete'
  | 'profile_academic_complete'
  | 'predictor_first_run'
  | 'career_risk_first_view'
  | 'financing_first_view'
  | 'loan_tab_opened'
  | 'document_first_upload'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'referral_signup'
  | 'loan_application_submitted';

export type XPLevel = 'Explorer' | 'Researcher' | 'Planner' | 'GradReady';

export function getXPLevel(xp: number): XPLevel {
  if (xp <= 100) return 'Explorer';
  if (xp <= 300) return 'Researcher';
  if (xp <= 600) return 'Planner';
  return 'GradReady';
}

export function getXPToNextLevel(xp: number): { current: number; max: number; level: XPLevel } {
  if (xp <= 100) return { current: xp, max: 100, level: 'Explorer' };
  if (xp <= 300) return { current: xp - 100, max: 200, level: 'Researcher' };
  if (xp <= 600) return { current: xp - 300, max: 300, level: 'Planner' };
  return { current: xp - 600, max: Infinity, level: 'GradReady' };
}

// ═══════════════════════════════════════════════════════════════
// JOURNEY + TIMELINE
// ═══════════════════════════════════════════════════════════════

export interface TimelineMilestone {
  month_offset: number;
  milestone: string;
  category: 'test_prep' | 'shortlisting' | 'documents' | 'applications' | 'financial' | 'visa' | 'pre_departure';
  details: string;
  priority: 'high' | 'medium';
  is_completed?: boolean;
  actual_date?: string;
}

export interface JourneyStep {
  id: string;
  stage: JourneyStage;
  title: string;
  description: string;
  estimated_timeframe: string;
  is_completed: boolean;
  xp_reward: number;
  linked_module: string | null;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export interface GradRightScore {
  university_matches: Array<{
    cluster: string;       // e.g. "Top US CS programs"
    fit_percentage: number;
    example_universities: string[];
  }>;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  loan_eligibility_band: 'likely' | 'moderate' | 'unlikely';
  risk_label: RiskLabel;
  risk_one_liner: string;   // Claude-generated, 1 sentence
}

export interface UserProfileContext {
  first_name: string;
  target_country: string;
  degree_type: string;
  broad_field: string;
  target_intake: string;
  current_academic_level: string;
  journey_stage: JourneyStage;
  risk_label: RiskLabel | null;
}

// ═══════════════════════════════════════════════════════════════
// NBFC CONSOLE
// ═══════════════════════════════════════════════════════════════

export interface NBFCApplicationListItem {
  id: string;
  applicant_name: string;
  institute: string;
  program: string;
  target_country: string;
  risk_label: RiskLabel;
  placement_prob_6m: number;
  salary_band_low_lpa: number;
  salary_band_high_lpa: number;
  loan_amount_requested: number;
  status: LoanApplicationStatus;
  submitted_at: string;
  document_completeness_pct: number;
}

export interface NBFCPortfolioData {
  total_applications: number;
  pending_review: number;
  approval_rate: number;
  risk_distribution: { low: number; medium: number; high: number };
  cohort_heatmap: Array<{
    program_type: string;
    institute_tier: string;
    avg_risk_score: number;
    application_count: number;
    avg_placement_prob_6m: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper to create consistent API responses
export function apiSuccess<T>(data: T): APIResponse<T> {
  return { success: true, data };
}

export function apiError(message: string): APIResponse {
  return { success: false, error: message };
}
```
