import { z } from "zod";

export const CoBorrowerTypeSchema = z.enum([
  "none",
  "parent",
  "salaried_spouse",
  "other_family",
]);

export const LoanEligibilityPostSchema = z.object({
  family_income: z.number().positive(),
  collateral_available: z.boolean(),
  co_borrower_type: CoBorrowerTypeSchema,
  loan_amount_requested: z.number().positive(),
});

export type LoanEligibilityPostBody = z.infer<typeof LoanEligibilityPostSchema>;
