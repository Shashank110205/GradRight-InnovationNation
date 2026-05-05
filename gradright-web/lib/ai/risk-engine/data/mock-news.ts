/**
 * @deprecated Dashboard uses curated `lib/data/news.json` via `getCachedDashboardNews`.
 * Re-exported types align with the data layer for backwards compatibility.
 */
export type { RankedNewsItem as MockNewsItem } from "@/lib/data";

import type { RankedNewsItem } from "@/lib/data";

export const MOCK_NEWS_ITEMS: RankedNewsItem[] = [];
