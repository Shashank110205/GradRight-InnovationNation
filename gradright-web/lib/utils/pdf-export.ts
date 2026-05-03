import { jsPDF } from "jspdf";

import { calculateEMIComfortZone } from "@/lib/utils/calculations";

export type ParentSummaryData = {
  studentName: string;
  degreeLabel: string;
  fieldLabel: string;
  targetCountry: string;
  targetIntake: string | null;
  targetUniversitiesLine: string;
  /** Rough total program cost in INR for family-facing summary. */
  estimatedTotalCostInr: number;
  loanAmountInr: number;
  tenureMonths: number;
  interestRateAnnual: number;
  salaryBandLowLpa: number;
  salaryBandHighLpa: number;
};

const FAQ_PARENTS: Array<{ q: string; a: string }> = [
  {
    q: "Is this loan approved already?",
    a: "No. This pack is only to help your family plan. A lender still checks documents, income proof, and the course details before saying yes or no.",
  },
  {
    q: "When do we start paying back?",
    a: "Many education loans wait until studies finish or for a short grace period after that. The exact start date depends on the offer you sign, so read the schedule on the sanction letter.",
  },
  {
    q: "What if our child needs more money mid-year?",
    a: "Some loans allow extra draw-downs for tuition or living costs if the college asks for it. Ask the lender how top-ups work before you sign.",
  },
  {
    q: "Can we pay early without a heavy penalty?",
    a: "Rules differ by lender. Ask for the prepayment clause in plain language and keep a copy with your files.",
  },
  {
    q: "What papers should we keep ready?",
    a: "Usually admission proof, fee schedule, KYC for borrower and co-borrower, and income proof. Your lender will give a checklist—match your files to that list.",
  },
];

function wrapText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function amortizationBalanceSamples(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  maxPoints: number
): { month: number; balance: number }[] {
  if (principal <= 0 || tenureMonths <= 0) {
    return [{ month: 0, balance: 0 }];
  }
  const r = annualRate / 12;
  const emi =
    (principal * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1);
  let bal = principal;
  const out: { month: number; balance: number }[] = [{ month: 0, balance: bal }];
  const step = Math.max(1, Math.floor(tenureMonths / maxPoints));
  for (let m = 1; m <= tenureMonths; m++) {
    const interest = bal * r;
    const princ = emi - interest;
    bal = Math.max(0, bal - princ);
    if (m % step === 0 || m === tenureMonths) {
      out.push({ month: m, balance: bal });
    }
  }
  return out;
}

/**
 * Four-page family summary (FEATURE_SPECS.md Module 7). Plain language; no risk scores.
 */
export async function generateParentSummaryPDF(
  data: ParentSummaryData
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = 22;

  doc.setFontSize(16);
  doc.text("GradRight — summary for family", margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  y = wrapText(
    doc,
    "This note uses rounded numbers to help you talk at home. It is not a loan approval or tax advice.",
    margin,
    y,
    maxW,
    5
  );
  y += 4;
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(12);
  doc.text("Learner", margin, y);
  y += 7;
  doc.setFontSize(10);
  y = wrapText(doc, data.studentName, margin, y, maxW, 5);
  y += 4;

  doc.setFontSize(12);
  doc.text("Target study plan", margin, y);
  y += 7;
  doc.setFontSize(10);
  const planLines = [
    `Program: ${data.degreeLabel} — ${data.fieldLabel}`,
    `Places: ${data.targetCountry}`,
    data.targetIntake ? `Planned intake: ${data.targetIntake}` : null,
    data.targetUniversitiesLine
      ? `Colleges in view: ${data.targetUniversitiesLine}`
      : null,
  ].filter(Boolean) as string[];
  for (const line of planLines) {
    y = wrapText(doc, line, margin, y, maxW, 5);
    y += 2;
  }

  y += 4;
  doc.setFontSize(12);
  doc.text("Rough cost picture (INR)", margin, y);
  y += 7;
  doc.setFontSize(10);
  y = wrapText(
    doc,
    `We show one simple total so you can compare with the college fee letter. Rough all-in estimate: ₹${new Intl.NumberFormat("en-IN").format(Math.round(data.estimatedTotalCostInr))}.`,
    margin,
    y,
    maxW,
    5
  );

  doc.addPage();
  y = 22;
  doc.setFontSize(16);
  doc.text("Loan and monthly payment (illustrative)", margin, y);
  y += 10;
  doc.setFontSize(10);

  const zone = calculateEMIComfortZone(
    data.salaryBandLowLpa,
    data.salaryBandHighLpa,
    data.loanAmountInr,
    data.tenureMonths,
    data.interestRateAnnual
  );

  const bullets = [
    `Loan amount shown: ₹${new Intl.NumberFormat("en-IN").format(Math.round(data.loanAmountInr))}`,
    `Tenure: ${data.tenureMonths} months`,
    `Illustrative yearly rate used: ${(data.interestRateAnnual * 100).toFixed(1)}%`,
    `Monthly EMI (same formula as the app): ₹${new Intl.NumberFormat("en-IN").format(zone.emi_monthly)}`,
    `If take-home matches the high end of the learner's predicted band, EMI is about ${zone.emi_pct_at_high_salary}% of take-home (take-home assumed at 78% of salary).`,
  ];
  for (const b of bullets) {
    y = wrapText(doc, `• ${b}`, margin, y, maxW, 5);
    y += 2;
  }
  y += 6;
  y = wrapText(
    doc,
    `Predicted starting salary band in the app: ₹${Math.round(data.salaryBandLowLpa)}–${Math.round(data.salaryBandHighLpa)} LPA (lakhs per year). Real offers can be higher or lower.`,
    margin,
    y,
    maxW,
    5
  );

  doc.addPage();
  y = 22;
  doc.setFontSize(16);
  doc.text("Repayment path (simple picture)", margin, y);
  y += 10;
  doc.setFontSize(10);
  y = wrapText(
    doc,
    "The blue line shows how the main loan balance could fall if payments stay on schedule. Your lender's statement is the official record.",
    margin,
    y,
    maxW,
    5
  );
  y += 10;

  const samples = amortizationBalanceSamples(
    data.loanAmountInr,
    data.interestRateAnnual,
    data.tenureMonths,
    14
  );
  const chartLeft = margin;
  const chartBottom = 200;
  const chartW = maxW;
  const chartH = 70;
  const maxBal = samples[0]?.balance ?? 1;

  doc.setDrawColor(220, 220, 220);
  doc.rect(chartLeft, chartBottom - chartH, chartW, chartH);
  doc.setDrawColor(59, 130, 246);

  const path: { x: number; y: number }[] = [];
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    const t = samples.length <= 1 ? 0 : i / (samples.length - 1);
    const x = chartLeft + t * chartW;
    const yy =
      chartBottom - (s.balance / maxBal) * (chartH - 6) - 3;
    path.push({ x, y: yy });
  }
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    doc.line(a.x, a.y, b.x, b.y);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Time →", chartLeft + chartW - 18, chartBottom + 4);
  doc.text("Balance falls ↓", chartLeft, chartBottom - chartH - 4);
  doc.setTextColor(0, 0, 0);

  y = chartBottom + 14;
  doc.setFontSize(10);
  y = wrapText(
    doc,
    "What usually happens next: collect fee letters, compare two or three lenders, pick co-borrower and collateral options, then file the application pack the lender asks for.",
    margin,
    y,
    maxW,
    5
  );

  doc.addPage();
  y = 22;
  doc.setFontSize(16);
  doc.text("Quick questions parents ask", margin, y);
  y += 10;
  doc.setFontSize(10);
  for (const item of FAQ_PARENTS) {
    doc.setFont("helvetica", "bold");
    y = wrapText(doc, item.q, margin, y, maxW, 5);
    y += 1;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, item.a, margin, y, maxW, 5);
    y += 6;
  }

  return doc.output("blob");
}
