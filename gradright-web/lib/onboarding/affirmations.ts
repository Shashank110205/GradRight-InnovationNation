import type { OnboardingQuestionKey } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

function multiCountryInsight(countries: string[]): string | null {
  if (countries.length < 2) return null;
  const hasUS = countries.some((c) => c.includes("United States"));
  const hasDE = countries.some((c) => c.includes("Germany"));
  if (hasUS && hasDE) {
    return "US–Germany mix: contrast selectivity and financing paths early so your shortlist stays realistic.";
  }
  if (hasUS) {
    return "Multi-destination with the US in play: balance reach schools with financing readiness and timeline.";
  }
  return "Smart combo — we will thread advice across destinations without flattening your story.";
}

/** Short, contextual “AI strategist” lines after each answer (1–2 sentences, honest tone). */
export function affirmationForSelection(
  key: OnboardingQuestionKey,
  option: string,
  context?: { allCountries?: string[] }
): string {
  if (key === "target_country") {
    const list = context?.allCountries ?? parseTargetCountries(option);
    const multi = multiCountryInsight(list);
    if (multi) return multi;
    const primary = list[0]?.trim() || option.trim();
    const single: Record<string, string> = {
      "United States":
        "The US can unlock strong upside — financing readiness and selectivity both matter, early.",
      "United Kingdom":
        "The UK rewards tight storytelling and time-to-market on applications — we will pace you accordingly.",
      Canada:
        "Canada blends quality of life and pragmatic pathways — strong fit if you want balance without extremes.",
      Germany:
        "Germany often balances ROI with affordability, especially for technical pathways — worth pressure-testing living costs.",
      Australia:
        "Australia pairs lifestyle with growing tech and research hubs — internships and visas deserve a deliberate plan.",
      "India (Domestic)":
        "Domestic ladders favor crisp targets and financing clarity — we will keep signals India-realistic, not generic abroad copy.",
    };
    return (
      single[primary] ??
      "Destination noted — we will calibrate admits, placement, and financing to this context."
    );
  }

  if (key === "degree_type") {
    const m: Record<string, string> = {
      "Masters (MS/MSc)":
        "MS track: research credibility, internships, and test timing stack together — we will weight all three fairly.",
      MBA:
        "MBA path: outcomes and network quality rise with narrative and quant proof — we will mirror how recruiters read you.",
      "MiM / Masters in Management":
        "MiM fits early-career velocity — we will emphasize trajectory and leadership signals without over-selling experience.",
      PhD:
        "PhD is a long arc — funding, fit with advisors, and publication paths deserve more patience than placement hype.",
      "PG Diploma":
        "Skills-first route: employability signals and portfolio depth matter more than brand alone — we will reflect that.",
    };
    return m[option] ?? "Program level saved — next we align field and timeline pressure.";
  }

  if (key === "broad_field") {
    const m: Record<string, string> = {
      "Computer Science / IT":
        "CS / IT rewards shipped work and internships — demand is real, but so is competition; we will stay specific.",
      Engineering:
        "Engineering paths reward labs, design depth, and safety-critical thinking — we will align placement language to that.",
      "Business / Finance":
        "Business tracks read for judgment under ambiguity — case wins and credible quant signals move the needle.",
      "Life Sciences / Healthcare":
        "Life sciences hinge on regulation, research patience, and mission clarity — we will avoid generic tech hype.",
      "Arts / Design / Social Sciences":
        "Portfolio and narrative carry more than a single test score — we will keep recommendations human-centered.",
      Other:
        "Broad field noted — we will keep recommendations flexible until you sharpen the niche.",
    };
    return m[option] ?? "Field saved — tailoring the rest of your discovery path.";
  }

  if (key === "target_intake") {
    if (option.includes("Still exploring")) {
      return "Exploring is fine — we will keep timelines elastic and show ranges so you can decide without pressure.";
    }
    if (option.includes("2025")) {
      return "Near-term intake: deadlines compress fast — we will front-load the highest-leverage moves first.";
    }
    return "Intake locked — milestones and test cadence can now track to something concrete, not abstract.";
  }

  if (key === "current_academic_level") {
    const m: Record<string, string> = {
      "2nd year undergraduate":
        "Early runway: small wins now (projects, tests, internships) compound into stronger admits later.",
      "Final year undergraduate":
        "Final-year energy: timelines are real — we will prioritize sequencing over generic advice.",
      "Recently graduated":
        "Fresh graduate mode: proof of outcomes and skill depth can offset fewer years of experience.",
      "Working professional (1-3 yrs)":
        "Early-career working mode: scope and impact stories can lift both scholarships and placement reads.",
      "Working professional (3+ yrs)":
        "Experienced hire path: leadership and outcomes can strengthen financing and admit narratives — we will use that signal.",
    };
    return (
      m[option] ??
      "Thanks — we will calibrate experience and placement timing from where you actually are."
    );
  }

  if (key === "budget_band_usd") {
    if (option.includes("Not sure")) {
      return "Uncertainty is normal — we will show responsible ranges so you can decide without shame or hype.";
    }
    if (option.startsWith("Under")) {
      return "Budget-aware planning can improve financing efficiency and reduce long-term pressure — selectivity and geography matter more here.";
    }
    if (option.includes("30,000") || option.includes("50,000")) {
      return "Mid-band budgets reward smart geography and scholarship layering — we will keep tradeoffs explicit.";
    }
    if (option.includes("80,000")) {
      return "Higher budget opens optionality — still worth optimizing ROI so every dollar supports your story, not noise.";
    }
    return "Budget noted — we will align destinations and loan signals responsibly, without promising approvals.";
  }

  if (key === "loan_needed") {
    const needs = option !== "No, I have other funding";
    return needs
      ? "Loan intent on file — we will show eligibility-style hints, not lender guarantees."
      : "Other funding first — we will still surface financing context so backup plans stay visible.";
  }

  return "Locked in — your path is getting sharper with every answer.";
}
