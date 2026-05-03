export type MockNewsItem = {
  id: string;
  source: string;
  headline: string;
  summary: string;
  url: string;
};

export const MOCK_NEWS_ITEMS: MockNewsItem[] = [
  {
    id: "1",
    source: "Study abroad",
    headline: "US grad programs tighten funding transparency for 2026 admits",
    summary:
      "Several departments are publishing clearer stipend and fee data earlier in the cycle—useful when you compare offers.",
    url: "https://example.com/news/grad-funding-transparency",
  },
  {
    id: "2",
    source: "India · Education finance",
    headline: "RBI reminders on co-borrower norms for overseas education loans",
    summary:
      "Lenders still weigh parental income and collateral; paperwork consistency matters more than headline interest rates.",
    url: "https://example.com/news/education-loan-co-borrower",
  },
  {
    id: "3",
    source: "Career signals",
    headline: "Early-career hiring for analytics roles stabilizes after last year’s reset",
    summary:
      "Internships and quantified project outcomes remain the strongest differentiator for placement within six months.",
    url: "https://example.com/news/analytics-hiring",
  },
];
