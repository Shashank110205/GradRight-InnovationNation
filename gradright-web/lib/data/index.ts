import type { StudentProfile } from "@/lib/types";
import { parseTargetCountries } from "@/lib/types";

import type {
  CostRow,
  JobRow,
  NewsRow,
  ScholarshipRow,
  UniversityRow,
  VisaRow,
} from "./types";

import costData from "./cost.json";
import jobsData from "./jobs.json";
import newsData from "./news.json";
import scholarshipsData from "./scholarships.json";
import universitiesData from "./universities.json";
import visaData from "./visa.json";

const universities = universitiesData as UniversityRow[];
const jobs = jobsData as JobRow[];
const scholarships = scholarshipsData as ScholarshipRow[];
const visas = visaData as VisaRow[];
const costs = costData as CostRow[];
const news = newsData as NewsRow[];

/** Short-lived in-process cache for deterministic dataset rankings (per server instance). */
const CACHE_TTL_MS = 5 * 60 * 1000;

type MemoryCacheEntry<T> = {
  value: T;
  evictId: ReturnType<typeof setTimeout>;
};

const memoryCache = new Map<string, MemoryCacheEntry<unknown>>();

function scheduleEviction(key: string): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    memoryCache.delete(key);
  }, CACHE_TTL_MS);
}

/**
 * Returns cached rankings immediately when present, then recomputes in a microtask
 * and refreshes the entry (stale-while-revalidate style for sync dataset helpers).
 */
function withMemoryCache<T>(key: string, compute: () => T): T {
  const existing = memoryCache.get(key) as MemoryCacheEntry<T> | undefined;
  if (existing) {
    clearTimeout(existing.evictId);
    const stale = existing.value;
    memoryCache.set(key, { value: stale, evictId: scheduleEviction(key) });
    queueMicrotask(() => {
      try {
        const next = compute();
        const prev = memoryCache.get(key) as MemoryCacheEntry<T> | undefined;
        if (prev) clearTimeout(prev.evictId);
        memoryCache.set(key, { value: next, evictId: scheduleEviction(key) });
      } catch {
        const prev = memoryCache.get(key) as MemoryCacheEntry<T> | undefined;
        if (prev) clearTimeout(prev.evictId);
        memoryCache.set(key, { value: stale, evictId: scheduleEviction(key) });
      }
    });
    return stale;
  }

  const result = compute();
  const evictId = scheduleEviction(key);
  memoryCache.set(key, { value: result, evictId });
  return result;
}

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase();
}

function profileCountries(p: StudentProfile | null): string[] {
  if (!p?.target_country?.trim()) return [];
  return parseTargetCountries(p.target_country);
}

function profileField(p: StudentProfile | null): string {
  return (p?.broad_field ?? "").trim();
}

function cgpaNorm(p: StudentProfile | null): number | null {
  if (p?.cgpa == null || p.cgpa_scale <= 0) return null;
  const cg = Number(p.cgpa);
  const scale = Number(p.cgpa_scale);
  if (!Number.isFinite(cg) || !Number.isFinite(scale) || scale <= 0) {
    return null;
  }
  return Math.min(1, Math.max(0, cg / scale));
}

function profileDatasetCacheKey(
  profile: StudentProfile | null,
  limit: number,
  kind: "news" | "universities" | "jobs"
): string {
  return JSON.stringify({
    kind,
    countries: profileCountries(profile),
    field: profileField(profile),
    cgpa: cgpaNorm(profile),
    limit,
  });
}

function fieldMatches(rowField: string, profileField: string): boolean {
  if (!profileField) return true;
  const a = norm(rowField);
  const b = norm(profileField);
  return a.includes(b) || b.includes(a) || a.split(/\s+/).some((w) => w.length > 3 && b.includes(w));
}

function countryMatches(rowCountry: string, targets: string[]): boolean {
  if (!targets.length) return true;
  const rc = norm(rowCountry);
  return targets.some((t) => {
    const tc = norm(t);
    return rc.includes(tc) || tc.includes(rc) || (tc.includes("us") && rc.includes("united states"));
  });
}

/** Rank universities: ROI, placement, field and country fit. */
function computeUniversities(profile: StudentProfile | null, limit: number): UniversityRow[] {
  const targets = profileCountries(profile);
  const field = profileField(profile);
  const cg = cgpaNorm(profile);
  const tierOrder = { top20: 4, top50: 3, top100: 2, regional: 1 } as const;

  const scored = universities
    .filter((u) => countryMatches(u.country, targets))
    .map((u) => {
      const fieldFit = u.fields.some((f) => fieldMatches(f, field)) ? 12 : 4;
      const tierBoost = tierOrder[u.ranking_band] * 6;
      const cgpaBoost =
        cg != null
          ? u.ranking_band === "top20" && cg < 0.82
            ? -8
            : u.ranking_band === "regional" && cg >= 0.78
              ? 10
              : 0
          : 0;
      const score =
        u.roi_index * 0.45 + u.placement_index * 0.35 + fieldFit + tierBoost + cgpaBoost;
      return { u, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.u);

  return scored.length ? scored : [...universities].sort((a, b) => b.roi_index - a.roi_index).slice(0, limit);
}

export function getUniversities(profile: StudentProfile | null, limit = 8): UniversityRow[] {
  return withMemoryCache(profileDatasetCacheKey(profile, limit, "universities"), () =>
    computeUniversities(profile, limit)
  );
}

function computeJobs(profile: StudentProfile | null, limit: number): JobRow[] {
  const targets = profileCountries(profile);
  const field = profileField(profile);
  const ranked = [...jobs]
    .filter((j) => countryMatches(j.country, targets))
    .filter((j) => fieldMatches(j.field, field) || !field)
    .sort(
      (a, b) =>
        b.demand_index * 0.55 +
        b.median_salary_usd / 5000 -
        (a.demand_index * 0.55 + a.median_salary_usd / 5000)
    )
    .slice(0, limit);
  if (ranked.length > 0) {
    return ranked;
  }
  return [...jobs]
    .sort(
      (a, b) =>
        b.demand_index * 0.55 +
        b.median_salary_usd / 5000 -
        (a.demand_index * 0.55 + a.median_salary_usd / 5000)
    )
    .slice(0, limit);
}

export function getJobs(profile: StudentProfile | null, limit = 8): JobRow[] {
  return withMemoryCache(profileDatasetCacheKey(profile, limit, "jobs"), () => computeJobs(profile, limit));
}

export function getScholarships(profile: StudentProfile | null, limit = 8): ScholarshipRow[] {
  const targets = profileCountries(profile);
  const field = profileField(profile);
  const ranked = [...scholarships]
    .filter((s) => countryMatches(s.host_country, targets))
    .filter((s) =>
      s.field_focus.some((f) => fieldMatches(f, field)) ? true : !field
    )
    .sort((a, b) => {
      const comp = { high: 3, medium: 2, selective: 2.5 } as Record<string, number>;
      return (comp[b.competitiveness] ?? 1) + (b.coverage === "full" ? 2 : 0) -
        ((comp[a.competitiveness] ?? 1) + (a.coverage === "full" ? 2 : 0));
    })
    .slice(0, limit);
  if (ranked.length > 0) {
    return ranked;
  }
  return [...scholarships]
    .sort((a, b) => {
      const comp = { high: 3, medium: 2, selective: 2.5 } as Record<string, number>;
      return (comp[b.competitiveness] ?? 1) - (comp[a.competitiveness] ?? 1);
    })
    .slice(0, limit);
}

export function getVisa(profile: StudentProfile | null, limit = 6): VisaRow[] {
  const targets = profileCountries(profile);
  const rows = [...visas].filter((v) => countryMatches(v.country, targets));
  return (rows.length ? rows : [...visas])
    .sort((a, b) => b.post_study_work_months - a.post_study_work_months)
    .slice(0, limit);
}

export function getCosts(profile: StudentProfile | null, limit = 8): CostRow[] {
  const targets = profileCountries(profile);
  const ranked = [...costs]
    .filter((c) => countryMatches(c.country, targets))
    .sort(
      (a, b) =>
        a.living_monthly_usd +
        a.tuition_public_usd_year / 12 -
        (b.living_monthly_usd + b.tuition_public_usd_year / 12)
    )
    .slice(0, limit);
  if (ranked.length > 0) {
    return ranked;
  }
  return [...costs]
    .sort(
      (a, b) =>
        a.living_monthly_usd +
        a.tuition_public_usd_year / 12 -
        (b.living_monthly_usd + b.tuition_public_usd_year / 12)
    )
    .slice(0, limit);
}

export type RankedNewsItem = NewsRow & {
  relevance_score: number;
  relevance_tag: string | null;
};

/** Client-safe news row for dashboard tiles (minimal payload). */
export type DashboardNewsFeedItem = Pick<
  RankedNewsItem,
  "id" | "source" | "relevance_tag" | "headline" | "summary" | "url"
>;

function computeNews(profile: StudentProfile | null, limit: number): RankedNewsItem[] {
  const targets = profileCountries(profile);
  const field = profileField(profile);

  const ranked = news.map((n) => {
    let score = 0;
    let tag: string | null = null;
    const hitCountry = n.countries.some((c) => countryMatches(c, targets));
    const hitField = n.fields.some((f) => fieldMatches(f, field));
    if (hitCountry) {
      score += 14;
      const primary = targets[0] ?? n.countries[0];
      if (primary) tag = `This matters for your ${primary} plan`;
    }
    if (hitField) score += 8;
    if (profile?.scholarship_priority?.includes("scholar") && /scholar|funding|loan|stipend|aid/i.test(n.headline + n.summary)) {
      score += 6;
    }
    return { ...n, relevance_score: score, relevance_tag: tag };
  });

  const sliced = ranked
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);
  if (sliced.length > 0) {
    return sliced;
  }
  return news
    .slice(0, limit)
    .map((n) => ({ ...n, relevance_score: 0, relevance_tag: null as string | null }));
}

export function getNews(profile: StudentProfile | null, limit = 5): RankedNewsItem[] {
  return withMemoryCache(profileDatasetCacheKey(profile, limit, "news"), () => computeNews(profile, limit));
}

export { universities, jobs, scholarships, visas, costs, news };
