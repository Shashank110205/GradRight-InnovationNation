export type MockNewsItem = {
  id: string;
  source: string;
  headline: string;
  summary: string;
  url: string;
  /** Why the headline matters in the cycle (non-generic). */
  why_matters?: string;
  /** Tied to the student profile when surfaced on the dashboard. */
  why_for_you?: string;
  recommended_action?: string;
};

export const MOCK_NEWS_ITEMS: MockNewsItem[] = [
  {
    id: "1",
    source: "Study abroad",
    headline: "US grad programs tighten funding transparency for 2026 admits",
    summary:
      "Several departments are publishing clearer stipend and fee data earlier in the cycle—useful when you compare offers.",
    url: "https://example.com/news/grad-funding-transparency",
    why_matters:
      "Offer comparison is shifting from sticker price to total cost of attendance and stipend clarity.",
    why_for_you:
      "If you are US-bound, this changes which questions to ask programs before you commit deposits.",
    recommended_action:
      "Draft a 5-question email template for programs you are considering (stipend, fees, health, summer funding).",
  },
  {
    id: "2",
    source: "India · Education finance",
    headline: "RBI reminders on co-borrower norms for overseas education loans",
    summary:
      "Lenders still weigh parental income and collateral; paperwork consistency matters more than headline interest rates.",
    url: "https://example.com/news/education-loan-co-borrower",
    why_matters:
      "Loan readiness is as much about document consistency and co-borrower strength as about credit score.",
    why_for_you:
      "Families financing abroad should align bank statements, ITRs, and collateral narratives early.",
    recommended_action:
      "Open Funding and list co-borrower documents you already have vs. what is still missing.",
  },
  {
    id: "3",
    source: "Career signals",
    headline: "Early-career hiring for analytics roles stabilizes after last year’s reset",
    summary:
      "Internships and quantified project outcomes remain the strongest differentiator for placement within six months.",
    url: "https://example.com/news/analytics-hiring",
    why_matters:
      "Placement models reward measurable outcomes—projects with metrics beat role titles alone.",
    why_for_you:
      "If your path is analytics or CS-adjacent, your resume bullets should read like outcomes, not tasks.",
    recommended_action:
      "Run profile intelligence once and ensure two quantified project bullets are visible in your CV.",
  },
];
