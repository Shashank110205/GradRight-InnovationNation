import type { LoanApplication } from "@/lib/types";

export function mergeOcrExtractedData(
  existing: LoanApplication | null,
  incoming: Record<string, unknown> | null | undefined,
  loanProgram?: Record<string, unknown> | null
): Record<string, unknown> | null {
  const base = {
    ...(existing?.ocr_extracted_data &&
    typeof existing.ocr_extracted_data === "object"
      ? existing.ocr_extracted_data
      : {}),
  } as Record<string, unknown>;

  if (incoming && typeof incoming === "object") {
    Object.assign(base, incoming);
  }
  if (loanProgram && typeof loanProgram === "object") {
    base.loan_program = loanProgram;
  }

  return Object.keys(base).length ? base : null;
}
