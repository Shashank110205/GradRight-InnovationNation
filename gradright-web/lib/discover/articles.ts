/**
 * Modular discover content — swap for CMS / API later without URL churn.
 * Article frame: what happened → why it matters → for you → action → Ask AI (via Explainability / mentor).
 */

export type DiscoverArticle = {
  slug: string;
  title: string;
  dek: string;
  countryTags: readonly string[];
  fieldTags: readonly string[];
  whatHappened: string;
  whyItMatters: string;
  forYou: string;
  recommendedAction: string;
  askAiSeed: string;
};

export const DISCOVER_ARTICLES: readonly DiscoverArticle[] = [
  {
    slug: "country-guides-overview",
    title: "Choosing a country isn’t a lottery — it’s a fit problem",
    dek: "How to shortlist destinations without drowning in Reddit threads.",
    countryTags: ["Global"],
    fieldTags: ["Planning"],
    whatHappened:
      "More programs moved to holistic review and transparent visa pathways, while costs and timelines diverged sharply by region.",
    whyItMatters:
      "The biggest mistake is copying someone else’s map. Fit beats hype: visa realism, cohort diversity, and your own risk tolerance matter as much as rankings.",
    forYou:
      "If you already picked a country in onboarding, treat this as a sanity check. If you’re unsure, we’ll bias toward options that match your budget band and career horizon.",
    recommendedAction:
      "Write down three non-negotiables (cost ceiling, partner hiring, time-to-payback). Re-rank countries against those — not against your friend’s admit story.",
    askAiSeed:
      "Given my target country and field, what should I sanity-check first about visas and realistic timelines?",
  },
  {
    slug: "admissions-explained",
    title: "Admissions in plain English (what committees actually optimize)",
    dek: "Signals, stories, and statistics — without the mystique.",
    countryTags: ["US", "UK", "Canada"],
    fieldTags: ["Admissions"],
    whatHappened:
      "Selective programs weight academic readiness, research/work proof, and cohort fit — increasingly with structured rubrics instead of vibes-only reads.",
    whyItMatters:
      "When you know the rubric, you stop guessing which extracurricular “counts” and start stacking evidence that matches your story.",
    forYou:
      "Your CGPA and tests are table stakes. Differentiation usually comes from coherent narrative + credible proof (projects, publications, work scope).",
    recommendedAction:
      "List 5 proof points you can verify (LOR writers, GitHub, papers, shipped work). Map each to one sentence in your story arc.",
    askAiSeed:
      "Help me turn my proof points into a coherent admissions narrative without writing my essay for me.",
  },
  {
    slug: "sop-lor-playbook",
    title: "SOP / LOR playbook: specificity beats adjectives",
    dek: "What recommenders need from you so letters don’t sound generic.",
    countryTags: ["Global"],
    fieldTags: ["Applications"],
    whatHappened:
      "Strong letters increasingly cite concrete outcomes and comparisons to peers — vague praise triggers skepticism.",
    whyItMatters:
      "A generic LOR is a silent downgrade. The SOP should explain decisions and tradeoffs, not restate your resume.",
    forYou:
      "Prepare a 1-pager for each recommender: class rank context, one flagship project, and the exact program angle you’re pursuing.",
    recommendedAction:
      "Draft bullet prompts for recommenders today — even if you won’t send them until next month.",
    askAiSeed:
      "Review my bullet prompts for recommenders and tell me where I’m still too vague.",
  },
  {
    slug: "scholarship-strategy-starter",
    title: "Scholarship strategy: stack small wins before you chase hero awards",
    dek: "Build credibility loops that make bigger asks believable.",
    countryTags: ["Global"],
    fieldTags: ["Funding"],
    whatHappened:
      "Merit aid shrank in some regions while targeted scholarships (identity, region, research area) grew — with clearer eligibility grids.",
    whyItMatters:
      "Scholarships reward clarity: who you help, what you’ve shipped, and how you’ll use the award. Scattershot applications burn cycles.",
    forYou:
      "Start with 10 high-fit opportunities (country + field + eligibility you truly meet). Quality of story beats quantity of tabs.",
    recommendedAction:
      "Pick two scholarships and outline a 150-word “why me” each — reuse later in essays.",
    askAiSeed:
      "Given my field and target country, what scholarship categories should I prioritize first?",
  },
  {
    slug: "requirements-by-goal",
    title: "Requirements by goal: tests, transcripts, and proof",
    dek: "A single checklist mental model so nothing sneaks up on you.",
    countryTags: ["US", "UK", "EU", "Canada"],
    fieldTags: ["Requirements"],
    whatHappened:
      "Programs published more componentized requirements (video intros, timed writing, skills tests) alongside classic GRE/IELTS norms.",
    whyItMatters:
      "Missing one component can auto-reject. Treat requirements as a dependency graph, not a flat PDF.",
    forYou:
      "If your target needs GRE + AWA floors, schedule backwards from intake. If waivers exist, verify on official pages — don’t trust forums.",
    recommendedAction:
      "Create a dependency list: tests → transcripts → recommenders → portal fields. Put hard deadlines 2 weeks before school deadlines.",
    askAiSeed:
      "Help me build a dependency-style checklist for my target degree and country based on general patterns.",
  },
  {
    slug: "financial-literacy-abroad",
    title: "Financial literacy for studying abroad (without fear tactics)",
    dek: "Cash flow, not just tuition — so you can think in months, not panic.",
    countryTags: ["Global"],
    fieldTags: ["Funding"],
    whatHappened:
      "Students optimized for headline tuition while underestimating living velocity, FX swings, and term-length cash gaps.",
    whyItMatters:
      "Confidence comes from visibility: if you can model 12 months of cash flow, funding choices become calmer and reversible.",
    forYou:
      "Separate one-time costs (deposit, flight) from recurring burn (rent, food, transport). Add a 10% buffer for surprises.",
    recommendedAction:
      "Open your Funding hub cost planner and plug conservative rent + food — we’ll layer scholarships and EMI education only when you’re ready.",
    askAiSeed:
      "Walk me through a simple 12-month cash-flow framing for grad school without recommending specific lenders.",
  },
] as const;

export function getDiscoverArticle(slug: string): DiscoverArticle | undefined {
  return DISCOVER_ARTICLES.find((a) => a.slug === slug);
}

export function discoverArticleSlugs(): string[] {
  return DISCOVER_ARTICLES.map((a) => a.slug);
}
