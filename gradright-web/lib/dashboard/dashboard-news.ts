import { unstable_cache } from "next/cache";

import { getNews, type RankedNewsItem } from "@/lib/data";
import type { StudentProfile } from "@/lib/types";

export type { RankedNewsItem as DashboardNewsItem } from "@/lib/data";

function cacheKeyParts(profile: StudentProfile | null): string[] {
  return [
    "dashboard-data-news-v1",
    profile?.target_country ?? "",
    profile?.broad_field ?? "",
    profile?.scholarship_priority ?? "",
    String(profile?.profile_completeness_score ?? 0),
    (profile?.extracted_skills ?? []).slice(0, 5).join("|"),
  ];
}

export function selectNewsForProfile(
  profile: StudentProfile | null
): RankedNewsItem[] {
  return getNews(profile, 5);
}

export function getCachedDashboardNews(profile: StudentProfile | null) {
  return unstable_cache(
    async () => selectNewsForProfile(profile),
    cacheKeyParts(profile),
    { revalidate: 21600 }
  )();
}
