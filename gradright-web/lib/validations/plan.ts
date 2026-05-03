import { z } from "zod";

/** POST /api/plan/admission — request body. */
export const AdmissionPredictorPostSchema = z.object({
  cgpa: z.number().min(0).max(10),
  degree: z.string().min(1, "Degree is required"),
  targetUniversity: z.string().min(1, "Target university is required"),
  targetCourse: z.string().min(1, "Target course is required"),
  country: z.string().min(1, "Country is required"),
  testScores: z.object({
    gre: z.number().optional(),
    gmat: z.number().optional(),
    ielts: z.number().optional(),
    toefl: z.number().optional(),
  }),
  workExperienceYears: z.number().min(0).max(80),
  publications: z.number().min(0).max(500),
  extracurriculars: z.number().min(0).max(500),
});

export type AdmissionPredictorPostBody = z.infer<
  typeof AdmissionPredictorPostSchema
>;

/** POST /api/plan/admission — success payload. */
export type AdmissionPredictorResponse = {
  admissionProbability: number;
  safetySchools: string[];
  matchSchools: string[];
  reachSchools: string[];
  keyStrengths: string[];
  keyWeaknesses: string[];
  aiSummary: string;
};
