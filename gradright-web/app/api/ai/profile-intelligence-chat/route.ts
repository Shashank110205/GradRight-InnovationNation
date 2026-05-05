import { streamMentorConversation } from "@/lib/ai/gemini-chat";
import { getGeminiApiKey } from "@/lib/ai/env";
import { generateGemini, generateGeminiFromParts } from "@/lib/ai/providers/gemini";
import { createServerClient, createServiceRoleSupabaseClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { extractPdfText } from "@/lib/profile/extract-pdf-text";
import { enforceAiChatRateLimit } from "@/lib/rate-limit/ai-chat";
import { apiError, apiSuccess } from "@/lib/types";
import type { ModelMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 120;

const BUCKET = "loan-documents";

const extractSchema = z.object({
  mode: z.literal("extract"),
  resume_storage_path: z.string().min(8).max(500),
});

const chatSchema = z.object({
  mode: z.literal("chat"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(16000),
      })
    )
    .min(1)
    .max(40),
  extracted_context: z.string().max(80000).optional(),
});

function mimeFromPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  return "application/octet-stream";
}

function assertOwnResumePath(userId: string, storagePath: string): boolean {
  const prefix = `profile-resumes/${userId}/`;
  return storagePath.startsWith(prefix) && !storagePath.includes("..");
}

async function downloadResumeBuffer(
  userId: string,
  downloadPath: string
): Promise<{ buf: Buffer | null; mime: string | null }> {
  if (!assertOwnResumePath(userId, downloadPath)) {
    return { buf: null, mime: null };
  }
  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin.storage.from(BUCKET).download(downloadPath);
    if (error || !data) return { buf: null, mime: null };
    const buf = Buffer.from(await data.arrayBuffer());
    const maxBytes = 8 * 1024 * 1024;
    if (buf.length > maxBytes) return { buf: null, mime: null };
    return { buf, mime: mimeFromPath(downloadPath) };
  } catch {
    return { buf: null, mime: null };
  }
}

const EXTRACT_SYSTEM = `You are a strict JSON generator for GradRight resume intelligence.
Input: plain text from a résumé, or a PDF you can read directly (may be noisy).

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "skills": string[],
  "projects": { "title": string, "description"?: string }[],
  "internships": { "org": string, "role"?: string, "duration"?: string }[],
  "estimated_total_experience_years": number | null,
  "assistant_markdown": string
}

Rules:
- assistant_markdown: short friendly Markdown (headings + bullets) summarizing what you extracted for the student; no PII beyond what's in the résumé.
- Arrays never null; use [] if unknown.
- estimated_total_experience_years only if clearly inferable; else null.
- Do not invent employers, degrees, or employers not supported by the document.`;

async function plainTextFromResume(buf: Buffer, mime: string): Promise<string | null> {
  if (mime === "application/pdf") {
    const t = await extractPdfText(buf);
    return t.length >= 20 ? t : null;
  }
  if (mime.startsWith("text/") || mime === "application/octet-stream") {
    const t = buf.toString("utf8").replace(/\s+/g, " ").trim();
    return t.length >= 20 ? t : null;
  }
  return null;
}

type GeminiTextOk = { ok: true; text: string };
type GeminiTextFail = { ok: false; reason: string };

async function extractWithText(text: string): Promise<GeminiTextOk | GeminiTextFail> {
  return generateGemini({
    module: "profile-intelligence-extract",
    systemInstruction: EXTRACT_SYSTEM,
    prompt: `Résumé text:\n"""${text.slice(0, 80_000)}"""`,
    maxTokens: 8192,
    temperature: 0.15,
    responseMimeType: "application/json",
  });
}

async function extractWithPdf(buf: Buffer): Promise<GeminiTextOk | GeminiTextFail> {
  const b64 = buf.toString("base64");
  return generateGeminiFromParts({
    module: "profile-intelligence-extract-pdf",
    systemInstruction: `${EXTRACT_SYSTEM}\n\nThe résumé is attached as a PDF. Read it and output the JSON object.`,
    parts: [
      {
        text: "Extract structured profile data from this résumé PDF per the system instruction.",
      },
      { inlineData: { mimeType: "application/pdf", data: b64 } },
    ],
    maxTokens: 8192,
    temperature: 0.15,
    responseMimeType: "application/json",
  });
}

export async function POST(request: Request): Promise<Response | NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await getUserBySupabaseUID(authUser.id);
  if (!appUser || appUser.role === "nbfc_supervisor") {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  if (!appUser.onboarding_complete) {
    return NextResponse.json(apiError("Complete onboarding first"), { status: 400 });
  }

  const rate = await enforceAiChatRateLimit(appUser.id);
  if (!rate.allowed) {
    return NextResponse.json(apiError("Too many requests — try again shortly."), {
      status: 429,
    });
  }

  if (!getGeminiApiKey()) {
    return NextResponse.json(
      apiError("AI is not configured. Set GEMINI_API_KEY in your environment."),
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const ex = extractSchema.safeParse(json);
  if (ex.success) {
    const { buf, mime } = await downloadResumeBuffer(
      appUser.id,
      ex.data.resume_storage_path.trim()
    );
    if (!buf || !mime) {
      return NextResponse.json(apiError("Could not load file from storage."), {
        status: 400,
      });
    }

    const text = await plainTextFromResume(buf, mime);
    const attempts: Array<() => Promise<GeminiTextOk | GeminiTextFail>> = [];

    if (text && text.length >= 20) {
      attempts.push(() => extractWithText(text));
    }
    if (mime === "application/pdf") {
      attempts.push(() => extractWithPdf(buf));
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        apiError(
          "Could not read enough text from this file. Use a text-selectable PDF or TXT, or try exporting your résumé as PDF again."
        ),
        { status: 400 }
      );
    }

    let lastReason = "unknown";
    for (const run of attempts) {
      const gm = await run();
      if (!gm.ok) {
        lastReason = gm.reason;
        continue;
      }

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(
          gm.text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/gi, "")
        ) as Record<string, unknown>;
      } catch {
        parsed = {};
      }

      const skills = Array.isArray(parsed.skills)
        ? parsed.skills.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
      const internships = Array.isArray(parsed.internships) ? parsed.internships : [];
      const est =
        typeof parsed.estimated_total_experience_years === "number" &&
        Number.isFinite(parsed.estimated_total_experience_years)
          ? parsed.estimated_total_experience_years
          : null;
      const assistant_markdown =
        typeof parsed.assistant_markdown === "string"
          ? parsed.assistant_markdown.trim()
          : "Here is what I could extract from your résumé.";

      return NextResponse.json(
        apiSuccess({
          assistant_markdown,
          parsed_resume: {
            skills,
            projects,
            internships,
            estimated_total_experience_years: est,
          },
          extracted_context: JSON.stringify({
            skills,
            projects,
            internships,
            estimated_total_experience_years: est,
          }),
        })
      );
    }

    return NextResponse.json(
      apiError(
        lastReason === "key_missing"
          ? "GEMINI_API_KEY is missing."
          : "Extraction did not return usable data. Try another PDF export or check your API quota."
      ),
      { status: 503 }
    );
  }

  const ch = chatSchema.safeParse(json);
  if (!ch.success) {
    return NextResponse.json(apiError("Invalid body"), { status: 400 });
  }

  const ctx = ch.data.extracted_context?.trim() ?? "";
  const system = `You are GradRight Profile Intelligence — a concise, warm coach. You help students planning graduate study abroad. You run on Google Gemini.
Rules:
- Short paragraphs; prefer bullets when listing ideas.
- Never shame; frame gaps as next steps.
- Do not invent facts; if résumé context is missing, ask a clarifying question.
- Do not claim admissions, visa, or loan outcomes.

Résumé extraction context (JSON, may be partial):
${ctx || "{}"}`;

  const modelMessages: ModelMessage[] = ch.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const result = streamMentorConversation(system, modelMessages);
    const res = result.toTextStreamResponse({
      headers: { "Cache-Control": "no-store" },
    });
    if (!res.body) {
      return NextResponse.json(apiError("Empty stream"), { status: 500 });
    }
    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json(apiError(msg), { status: 503 });
  }
}
