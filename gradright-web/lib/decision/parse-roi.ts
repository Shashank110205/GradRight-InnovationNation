/**
 * Heuristic numeric parsing for ROI — not scoring logic (scoring remains in Python).
 */

/** Midpoint of first two numbers found in a string (LPA, k, etc.). */
export function parseNumberRangeMid(s: string | null | undefined): number | null {
  if (!s?.trim()) return null;
  const re = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)|(\d+(?:\.\d+)?)/g;
  const nums: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const raw = (m[1] ?? m[2]).replace(/,/g, "");
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) nums.push(n);
    if (nums.length >= 2) break;
  }
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0]!;
  return (nums[0]! + nums[1]!) / 2;
}

/** Salary midpoint in LPA when string mentions LPA/lakh; otherwise numeric mid as-is. */
export function parseSalaryMidLpa(salaryRange: string): number | null {
  const mid = parseNumberRangeMid(salaryRange);
  if (mid == null) return null;
  const low = salaryRange.toLowerCase();
  if (/\blakh|\blpa|₹|inr/i.test(low)) {
    return mid;
  }
  if (/\$|usd|\bk\b/i.test(low)) {
    return (mid / 1000) * 8.3;
  }
  return mid > 200 ? mid / 100000 : mid;
}

/** Annual tuition / fees as comparable scale (USD thousands normalized). */
export function parseFeesCostIndex(fees: string): number | null {
  const mid = parseNumberRangeMid(fees);
  if (mid == null) return null;
  const low = fees.toLowerCase();
  if (/\$|usd/i.test(low)) {
    return Math.max(1, mid / 1000);
  }
  if (/€|eur/i.test(low)) {
    return Math.max(1, (mid * 1.08) / 1000);
  }
  if (/£|gbp/i.test(low)) {
    return Math.max(1, (mid * 1.27) / 1000);
  }
  return Math.max(1, mid / 10000);
}
