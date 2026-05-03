import type { GradRightScore, OnboardingAnswers } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

const CLUSTERS: Record<
  string,
  Array<{ cluster: string; example_universities: string[] }>
> = {
  US_CS: [
    {
      cluster: "Top US tech & CS programs",
      example_universities: ["CMU", "Georgia Tech", "UT Austin"],
    },
    {
      cluster: "Strong STEM research universities",
      example_universities: ["Purdue", "UIUC", "UC San Diego"],
    },
    {
      cluster: "Emerging AI & data science hubs",
      example_universities: ["Northeastern", "ASU", "Indiana Bloomington"],
    },
  ],
  UK_BUSINESS: [
    {
      cluster: "UK finance & consulting targets",
      example_universities: ["LBS", "Oxford Saïd", "Cambridge Judge"],
    },
    {
      cluster: "Strong UK MSc programs",
      example_universities: ["Imperial", "Warwick", "Manchester"],
    },
    {
      cluster: "Specialized MSc pathways",
      example_universities: ["Bayes", "Cranfield", "Durham"],
    },
  ],
  DEFAULT: [
    {
      cluster: "Highly ranked programs in your region",
      example_universities: ["Target R1 / Russell Group peers", "Strong co-op schools"],
    },
    {
      cluster: "Balanced reach & target mix",
      example_universities: ["Public flagships", "Strong regional leaders"],
    },
    {
      cluster: "Skills-first & employability focus",
      example_universities: ["Industry-linked MSc paths", "STEM-designated options"],
    },
  ],
};

function clusterKey(answers: OnboardingAnswers): keyof typeof CLUSTERS {
  const countries = parseTargetCountries(answers.target_country);
  const us = countries.includes("United States");
  const uk = countries.includes("United Kingdom");
  const biz = answers.broad_field === "Business / Finance";
  if (us && answers.broad_field === "Computer Science / IT") return "US_CS";
  if (uk && biz) return "UK_BUSINESS";
  return "DEFAULT";
}

/**
 * Derives three university match rows; fit % anchored on placement probability.
 */
export function buildUniversityMatches(
  answers: OnboardingAnswers,
  placementProb6m: number
): GradRightScore["university_matches"] {
  const base = Math.round(Math.min(0.94, Math.max(0.38, placementProb6m)) * 100);
  const templates = CLUSTERS[clusterKey(answers)] ?? CLUSTERS.DEFAULT;

  return templates.map((t, i) => ({
    cluster: t.cluster,
    fit_percentage: Math.max(35, Math.min(96, base - i * 6)),
    example_universities: t.example_universities,
  }));
}
