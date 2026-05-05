import { cache } from "react";

import {
  createDashboardStudentProfileFallback,
} from "@/lib/dashboard/dashboard-profile-fallback";
import { getJobs, getNews, getUniversities } from "@/lib/data";
import { getStudentProfileByUserId } from "@/lib/db/queries/student_profiles";
import { buildStudentIntelligence } from "@/lib/profile/student-intelligence";
import type { StudentProfile } from "@/lib/types";

/** Per-request dedupe: resolved student row or dashboard fallback shape. */
export const getCachedDashboardProfile = cache(async (userId: string): Promise<StudentProfile> => {
  const row = await getStudentProfileByUserId(userId);
  return row ?? createDashboardStudentProfileFallback(userId);
});

export const getCachedStudentIntelligence = cache((profile: StudentProfile | null) =>
  buildStudentIntelligence(profile)
);

export const getCachedNewsForProfile = cache((profile: StudentProfile | null, limit = 5) =>
  getNews(profile, limit)
);

export const getCachedUniversitiesForProfile = cache(
  (profile: StudentProfile | null, limit = 5) => getUniversities(profile, limit)
);

export const getCachedJobsForProfile = cache((profile: StudentProfile | null, limit = 5) =>
  getJobs(profile, limit)
);
