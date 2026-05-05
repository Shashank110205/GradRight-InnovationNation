import type { LatestRiskScoreSummary } from "@/lib/db/queries/risk_scores";
import type { StudentProfile } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiApiKey } from "@/lib/ai/env";
import { getGeminiModelId } from "@/lib/ai/providers/gemini";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";
import { safeGeminiGenerate } from "@/lib/ai/gemini-client";

const SYSTEM = `You help Indian students prepare education loan paperwork for study abroad.
Return ONLY valid JSON: { "items": string[] } where items are 8-12 short checklist lines (each one line, actionable).
Include typical KYC and lender asks: PAN, address proof, admission/offer, fee structure, co-borrower ID & income proof, bank statements, ITR, salary slips if employed, collateral docs if applicable.
Tailor 2-3 items to the student's destination country and degree when known. No markdown.`;

function templateChecklist(profile: StudentProfile | null): string[] {
  const country = profile?.target_country?.trim() || "your destination country";
  const degree = profile?.degree_type?.trim() || "your program";
  return [
    `Government ID: PAN card (copy) matching the applicant name`,
    `Address proof (utility bill / Aadhaar address page) dated within typical lender windows`,
    `Admission letter or provisional offer for ${degree} (${country})`,
    "Institute fee schedule or cost breakdown the lender can reconcile",
    "Co-borrower KYC (PAN + address) and relationship proof",
    "Co-borrower income proof: ITR, Form 16, or business financials as applicable",
    "Last 6–12 months bank statements for salary / business flows",
    "Collateral documents only if you are pledging property or fixed deposits",
  ];
}

function parseItems(text: string): string[] | null {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  try {
    const o = JSON.parse(cleaned) as { items?: unknown };
    if (!Array.isArray(o.items)) return null;
    const items = o.items
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 14);
    return items.length >= 6 ? items : null;
  } catch {
    return null;
  }
}

/** C-002 / C-003: Loan doc checklist — Gemini (single key). */
export async function generateLoanDocumentChecklist(input: {
  profile: StudentProfile | null;
  risk: LatestRiskScoreSummary | null;
}): Promise<{ items: string[]; source: "gemini" | "template" }> {
  const fallback = templateChecklist(input.profile);
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { items: fallback, source: "template" };
  }

  const blob = {
    target_country: input.profile?.target_country,
    degree_type: input.profile?.degree_type,
    broad_field: input.profile?.broad_field,
    target_intake: input.profile?.target_intake,
    loan_needed: input.profile?.loan_needed,
    risk_label: input.risk?.risk_label,
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getGeminiModelId(),
      systemInstruction: SYSTEM,
    });
    logGeminiRequest(
      "generateLoanDocumentChecklist",
      apiKey,
      SYSTEM.length + JSON.stringify(blob).length
    );
    const result = await safeGeminiGenerate({
      module: "generateLoanDocumentChecklist",
      run: () =>
        model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: JSON.stringify(blob) }],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
        }),
    });
    const text = result.response.text()?.trim();
    if (!text) return { items: fallback, source: "template" };
    const items = parseItems(text);
    if (!items) return { items: fallback, source: "template" };
    return { items, source: "gemini" };
  } catch (e) {
    logGeminiError("generateLoanDocumentChecklist", e);
    console.warn("[generateLoanDocumentChecklist]", e);
    return { items: fallback, source: "template" };
  }
}
