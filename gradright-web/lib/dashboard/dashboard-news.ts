import { unstable_cache } from "next/cache";

import {
  MOCK_NEWS_ITEMS,
  type MockNewsItem,
} from "@/lib/ai/risk-engine/data/mock-news";
import type { StudentProfile } from "@/lib/types";

function scoreNewsItem(item: MockNewsItem, profile: StudentProfile | null): number {
  if (!profile) return 0;
  const blob = `${item.headline} ${item.summary}`.toLowerCase();
  let score = 0;
  const country = (profile.target_country ?? "").toLowerCase();
  if (
    (country.includes("united states") || country.includes("usa")) &&
    /\bus\b|u\.s\.|american|ivy|stem opt/.test(blob)
  ) {
    score += 3;
  }
  if (country.includes("canada") && blob.includes("canada")) score += 3;
  if (
    (country.includes("united kingdom") || country.includes("uk")) &&
    /\buk\b|britain|london/.test(blob)
  ) {
    score += 2;
  }
  if (country.includes("germany") && blob.includes("germany")) score += 2;

  const field = (profile.broad_field ?? "").toLowerCase();
  if (field.includes("computer") && /cs|software|analytics|data/.test(blob)) {
    score += 2;
  }
  if (field.includes("business") && /finance|mba|banking/.test(blob)) {
    score += 2;
  }

  const pri = (profile.scholarship_priority ?? "").toLowerCase();
  if (
    (pri.includes("scholar") || pri.includes("afford")) &&
    /scholar|funding|stipend|loan|rbi|fee|aid/.test(blob)
  ) {
    score += 3;
  }
  if (pri.includes("salary") && /salary|placement|hiring|lpa/.test(blob)) {
    score += 2;
  }

  const skills = profile.extracted_skills ?? [];
  for (const s of skills.slice(0, 8)) {
    const t = s.toLowerCase();
    if (t.length > 2 && blob.includes(t)) score += 1;
  }

  return score;
}

export function selectNewsForProfile(
  profile: StudentProfile | null
): MockNewsItem[] {
  return [...MOCK_NEWS_ITEMS].sort((a, b) => {
    return scoreNewsItem(b, profile) - scoreNewsItem(a, profile);
  });
}

export function getCachedDashboardNews(profile: StudentProfile | null) {
  const keyParts = [
    "dashboard-mock-news-v2",
    profile?.target_country ?? "",
    profile?.broad_field ?? "",
    profile?.scholarship_priority ?? "",
    String(profile?.profile_completeness_score ?? 0),
    (profile?.extracted_skills ?? []).slice(0, 5).join("|"),
  ];

  return unstable_cache(
    async () => selectNewsForProfile(profile),
    keyParts,
    { revalidate: 21600 }
  )();
}
