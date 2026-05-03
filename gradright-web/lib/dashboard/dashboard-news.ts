import { unstable_cache } from "next/cache";

import { MOCK_NEWS_ITEMS } from "@/lib/ai/risk-engine/data/mock-news";

export const getCachedDashboardNews = unstable_cache(
  async () => MOCK_NEWS_ITEMS,
  ["dashboard-mock-news"],
  { revalidate: 21600 }
);
