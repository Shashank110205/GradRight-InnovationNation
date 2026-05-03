export type XpTierInfo = {
  tierLabel: string;
  tierMin: number;
  tierMax: number | null;
  nextTierLabel: string | null;
  nextTierMin: number | null;
};

export function getXpTierInfo(xp: number): XpTierInfo {
  if (xp <= 100) {
    return {
      tierLabel: "Explorer",
      tierMin: 0,
      tierMax: 100,
      nextTierLabel: "Researcher",
      nextTierMin: 101,
    };
  }
  if (xp <= 300) {
    return {
      tierLabel: "Researcher",
      tierMin: 101,
      tierMax: 300,
      nextTierLabel: "Planner",
      nextTierMin: 301,
    };
  }
  if (xp <= 600) {
    return {
      tierLabel: "Planner",
      tierMin: 301,
      tierMax: 600,
      nextTierLabel: "GradReady",
      nextTierMin: 601,
    };
  }
  return {
    tierLabel: "GradReady",
    tierMin: 601,
    tierMax: null,
    nextTierLabel: null,
    nextTierMin: null,
  };
}

/** Progress 0–100 within current tier toward the next tier threshold. */
export function getXpProgressPercent(xp: number): number {
  const info = getXpTierInfo(xp);
  if (info.nextTierMin == null || info.tierMax == null) {
    return 100;
  }
  const span = info.tierMax - info.tierMin;
  if (span <= 0) return 100;
  const within = Math.min(Math.max(xp - info.tierMin, 0), span);
  return Math.round((within / span) * 100);
}
