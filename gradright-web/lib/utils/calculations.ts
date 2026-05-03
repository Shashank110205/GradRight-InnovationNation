import type { EMIComfortZone } from "@/lib/types";

/** FEATURE_SPECS.md Module 6 — EMI comfort vs predicted salary band. */
export function calculateEMIComfortZone(
  salaryBandLowLPA: number,
  salaryBandHighLPA: number,
  loanAmountINR: number,
  tenureMonths: number = 120,
  interestRateAnnual: number = 0.115
): EMIComfortZone {
  const monthlyRate = interestRateAnnual / 12;
  const emi =
    (loanAmountINR * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const monthlyIncomeAtLow = (salaryBandLowLPA * 100000) / 12;
  const monthlyIncomeAtHigh = (salaryBandHighLPA * 100000) / 12;

  const takeHomeLow = monthlyIncomeAtLow * 0.78;
  const takeHomeHigh = monthlyIncomeAtHigh * 0.78;

  const emiPctAtLow = (emi / takeHomeLow) * 100;
  const emiPctAtHigh = (emi / takeHomeHigh) * 100;

  return {
    emi_monthly: Math.round(emi),
    emi_pct_at_low_salary: Math.round(emiPctAtLow),
    emi_pct_at_high_salary: Math.round(emiPctAtHigh),
    comfort_label:
      emiPctAtHigh <= 25
        ? "comfortable"
        : emiPctAtHigh <= 40
          ? "moderate"
          : "high_stress",
  };
}

/**
 * Simple payback: total program cost (USD) divided by first-year salary in USD.
 * `salaryLPA` is lakhs INR per year; `exchangeRate` is INR per 1 USD.
 */
export function calculateROI(
  totalCostUSD: number,
  salaryLPA: number,
  exchangeRate: number
): { payback_years: number } {
  if (totalCostUSD <= 0 || salaryLPA <= 0 || exchangeRate <= 0) {
    return { payback_years: 0 };
  }
  const salaryInrPerYear = salaryLPA * 100000;
  const salaryUsdPerYear = salaryInrPerYear / exchangeRate;
  const payback = totalCostUSD / salaryUsdPerYear;
  return { payback_years: Math.round(payback * 10) / 10 };
}

export function formatSalaryBand(low: number, high: number): string {
  const a = Math.round(low);
  const b = Math.round(high);
  return `₹${a} – ${b} LPA`;
}

export function formatLoanAmount(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(amount))}`;
}
