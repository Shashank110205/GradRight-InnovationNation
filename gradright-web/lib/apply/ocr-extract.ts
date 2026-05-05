import { GoogleGenerativeAI } from "@google/generative-ai";

import { getGeminiApiKey } from "@/lib/ai/env";
import { getGeminiModelId } from "@/lib/ai/providers/gemini";
import { logGeminiError, logGeminiRequest } from "@/lib/ai/gemini-forensic-log";
import { safeGeminiGenerate } from "@/lib/ai/gemini-client";

export type LoanOcrDocumentType =
  | "marksheet"
  | "offer_letter"
  | "income_proof"
  | "pan"
  | "aadhaar";

function pickPan(text: string): string | null {
  const m = text.toUpperCase().match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
  return m?.[1] ?? null;
}

function pickAadhaarLast4(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  const m = digits.match(/(\d{4})$/);
  return m?.[1] ?? null;
}

function pickMoney(text: string): number | null {
  const m = text.match(/₹?\s*([\d,]+(?:\.\d+)?)\s*(?:L|LPA|lakhs?)?/i);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  const m2 = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*k?/i);
  if (m2) {
    const n = Number(m2[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickYear(text: string): number | null {
  const m = text.match(/\b(20\d{2})\b/);
  if (m) return Number(m[1]);
  return null;
}

/** Regex-first extraction; Gemini refines when enabled and text is messy. */
export async function extractLoanFieldsFromText(
  documentType: LoanOcrDocumentType,
  rawText: string
): Promise<Record<string, unknown>> {
  const text = rawText.replace(/\s+/g, " ").trim();
  const base: Record<string, unknown> = {};

  switch (documentType) {
    case "pan": {
      const pan = pickPan(text);
      if (pan) base.pan_number = pan;
      break;
    }
    case "aadhaar": {
      const last4 = pickAadhaarLast4(text);
      if (last4) base.aadhaar_last4 = last4;
      break;
    }
    case "marksheet": {
      const cgpa = text.match(/(\d\.\d{1,2})\s*(?:CGPA|GPA)/i);
      if (cgpa) base.cgpa = Number(cgpa[1]);
      const yr = pickYear(text);
      if (yr) base.graduation_year = yr;
      const name = text.match(/(?:name|student)\s*[:\-]\s*([A-Za-z .]+)/i);
      if (name) base.student_name = name[1].trim();
      break;
    }
    case "offer_letter": {
      const uni = text.match(/(?:University|College|Institute)\s*[:\-]\s*([^\n,]+)/i);
      if (uni) base.university = uni[1].trim();
      const prog = text.match(/(?:Program|Course)\s*[:\-]\s*([^\n,]+)/i);
      if (prog) base.program = prog[1].trim();
      const fees = pickMoney(text);
      if (fees) base.total_fees_usd = fees;
      const yr = pickYear(text);
      if (yr) base.intake_date = String(yr);
      break;
    }
    case "income_proof": {
      const inc = pickMoney(text);
      if (inc) base.annual_income = inc;
      const emp = text.match(/(?:employer|company)\s*[:\-]\s*([^\n,]+)/i);
      if (emp) base.employer_name = emp[1].trim();
      const ay = text.match(/(?:A\.?Y\.?|Assessment\s*Year)\s*[:\-]?\s*(20\d{2}-\d{2,4})/i);
      if (ay) base.assessment_year = ay[1];
      break;
    }
    default:
      break;
  }

  const sparse = Object.keys(base).length < 2;
  if (!sparse) return base;

  /** C-002 / C-003: document OCR assist — Gemini (single key). */
  const apiKey = getGeminiApiKey();
  if (!apiKey) return base;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getGeminiModelId(),
    });
    const prompt = `Document type: ${documentType}
OCR text:
"""
${text.slice(0, 8000)}
"""
Return ONLY minified JSON with fields for this document type:
- marksheet: student_name, institute, cgpa, graduation_year
- offer_letter: university, program, intake_date, total_fees_usd
- income_proof: annual_income, employer_name, assessment_year
- pan: pan_number
- aadhaar: aadhaar_last4 (last 4 digits only)
Omit keys you cannot infer.`;

    logGeminiRequest("ocr-extract", apiKey, prompt.length);

    const result = await safeGeminiGenerate({
      module: "ocr-extract",
      run: () =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
        }),
    });
    const out = result.response.text()?.trim();
    if (!out) return base;
    const cleaned = out.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return { ...base, ...parsed };
  } catch (e) {
    logGeminiError("ocr-extract", e);
    return base;
  }
}
