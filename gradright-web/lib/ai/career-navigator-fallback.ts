import type {
  CareerNavigatorPostBody,
  CareerNavigatorResponse,
} from "@/lib/validations/career-navigator";

function fieldProgram(field: CareerNavigatorPostBody["targetField"]): string {
  switch (field) {
    case "Software/Tech":
      return "MS Computer Science";
    case "Data Science":
      return "MS Data Science / ML";
    case "Finance/MBA":
      return "MS Finance / MBA";
    case "Healthcare":
      return "MPH / MS Biomedical Sciences";
    case "Engineering":
      return "MS Engineering";
    default:
      return "MS (aligned specialization)";
  }
}

export function buildCareerNavigatorFallback(
  input: CareerNavigatorPostBody
): CareerNavigatorResponse {
  const program = fieldProgram(input.targetField);
  const prefs = [...input.preferredCountries];
  const pad = (
    ["Canada", "USA", "UK", "Germany", "Australia"] as const
  ).filter((c) => !prefs.includes(c));
  const order = [...prefs, ...pad].slice(0, 5) as string[];

  const uniByCountry: Record<string, { uni: string; currency: string }> = {
    USA: { uni: "University of Illinois Urbana-Champaign", currency: "USD" },
    UK: { uni: "University of Edinburgh", currency: "GBP" },
    Canada: { uni: "University of British Columbia", currency: "CAD" },
    Germany: { uni: "TU Munich", currency: "EUR" },
    Australia: { uni: "University of Melbourne", currency: "AUD" },
  };

  const cgpaNote =
    input.currentCGPA >= 8.5
      ? "Strong GPA band supports selective programs if tests and essays land."
      : input.currentCGPA >= 7.5
        ? "Blend reach and match schools to manage admission risk."
        : "Use tests, projects, and experience to complement GPA.";

  const budgetHint =
    input.budgetRange === "Under 20L"
      ? "Prioritize lower tuition regions and scholarships."
      : input.budgetRange === "60L+"
        ? "Premium options and high-COL hubs are more feasible."
        : "Typical mid-band international spend.";

  const diffCycle = ["match", "match", "reach", "reach", "safety"] as const;

  const topRecommendations = order.map((country, i) => {
    const meta = uniByCountry[country] ?? uniByCountry["USA"];
    return {
      rank: i + 1,
      country,
      university: meta.uni,
      program,
      whyThisFits: `${budgetHint} Aligns with ${input.targetField} and your stated goal. ${cgpaNote}`,
      estimatedCost: {
        tuition:
          input.budgetRange === "Under 20L"
            ? "Approx. conservative tier"
            : input.budgetRange === "60L+"
              ? "Premium international tier"
              : "Mid international tier",
        living: "Metro estimate — verify on university site",
        currency: meta.currency,
      },
      avgStartingSalary:
        input.targetField === "Finance/MBA"
          ? "USD 90k–130k equivalent (role-dependent)"
          : "USD 105k–140k equivalent",
      roiScore: 82 - i * 3,
      admissionDifficulty: diffCycle[i] ?? "match",
      employmentRate: 88 - i * 2,
      visaFriendliness:
        country === "Canada" || country === "Germany"
          ? ("high" as const)
          : ("medium" as const),
    };
  });

  const goalSnippet =
    input.careerGoal.length > 90
      ? `${input.careerGoal.slice(0, 90)}…`
      : input.careerGoal;

  return {
    topRecommendations,
    bestCountryForYou: order[0] ?? "Canada",
    bestFieldForYou: input.targetField,
    reasoning: `Offline fallback for ${input.targetField} (${input.budgetRange}). ${cgpaNote} These are illustrative — confirm fees, intake, and visa rules on official sources.`,
    alternativePaths: [
      {
        path: "Domestic MTech then abroad PhD",
        pros: ["Lower immediate cost", "Build research track record"],
        cons: ["Delayed global mobility", "Longer pathway"],
      },
      {
        path: "1-year UK MSc → industry",
        pros: ["Fast credential", "International peer network"],
        cons: ["Shorter recruiting runway", "Visa planning needed"],
      },
    ],
    nextSteps: [
      `Map "${goalSnippet}" to 8–12 specific programs with STEM/designated status where relevant.`,
      "Book GRE/GMAT and IELTS/TOEFL with time for a second attempt if needed.",
      `Draft a narrative: ${input.currentDegree} → ${input.targetField} → target roles.`,
      "Build a COA sheet in INR using official fee pages + realistic housing.",
      "Line up recommenders with a brag sheet 6–8 weeks before deadlines.",
    ],
  };
}
