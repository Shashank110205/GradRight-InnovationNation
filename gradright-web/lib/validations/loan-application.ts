import { z } from "zod";

const documentRecordSchema = z.object({
  document_type: z.enum([
    "marksheet",
    "offer_letter",
    "income_proof",
    "pan",
    "aadhaar",
    "bank_statement",
    "gre_scorecard",
    "ielts_toefl_scorecard",
  ]),
  storage_path: z.string(),
  file_name: z.string(),
  uploaded_at: z.string(),
  ocr_status: z.enum(["pending", "extracted", "failed"]),
  extracted_fields: z.record(z.unknown()).nullable(),
});

export const LoanProgramTargetSchema = z.object({
  university: z.string().min(1, "University is required"),
  country: z.string().min(1, "Country is required"),
  intake: z.string().min(1, "Intake is required"),
  total_cost_usd: z.coerce.number().positive("Total cost must be positive"),
});

export const LoanApplicationPatchSchema = z.object({
  step_completed: z.number().int().min(-1).max(7).optional(),
  full_name: z.string().optional(),
  dob: z.string().optional().nullable(),
  pan_number: z.string().max(10).optional().nullable(),
  aadhaar_last4: z.string().max(4).optional().nullable(),
  address: z.string().optional(),
  institute: z.string().optional(),
  program: z.string().optional(),
  admission_confirmed: z.boolean().optional(),
  offer_letter_url: z.string().optional().nullable(),
  loan_amount_requested: z.coerce.number().positive().optional().nullable(),
  co_borrower_name: z.string().optional().nullable(),
  co_borrower_relation: z.string().optional().nullable(),
  collateral_available: z.boolean().optional(),
  family_income_annual: z.coerce.number().positive().optional().nullable(),
  documents: z.array(documentRecordSchema).optional(),
  ocr_extracted_data: z.record(z.unknown()).optional().nullable(),
  loan_program: LoanProgramTargetSchema.optional(),
});

export const LoanApplicationSubmitBodySchema = z.object({
  consentAccepted: z.literal(true),
});

export const DocumentOcrRequestSchema = z.object({
  storage_path: z.string().min(1),
  document_type: z.enum([
    "marksheet",
    "offer_letter",
    "income_proof",
    "pan",
    "aadhaar",
  ]),
});

export type LoanApplicationPatchInput = z.infer<typeof LoanApplicationPatchSchema>;
