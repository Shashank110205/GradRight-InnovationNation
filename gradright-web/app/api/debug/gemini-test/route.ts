import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { getGeminiApiKey } from "@/lib/ai/env";
import { getGeminiModelId } from "@/lib/ai/providers/gemini";

export const dynamic = "force-dynamic";

/**
 * Control probe — single GEMINI_API_KEY. Disabled in production unless GRADRIGHT_GEMINI_DEBUG_ROUTE=true.
 */
export async function GET(): Promise<NextResponse> {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.GRADRIGHT_GEMINI_DEBUG_ROUTE !== "true"
  ) {
    return NextResponse.json({ error: "disabled_in_production" }, { status: 404 });
  }

  const key = getGeminiApiKey();
  const presence = {
    GEMINI_API_KEY: key ? "SET" : "MISSING",
    model: getGeminiModelId(),
  };

  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        env: presence,
        error: "GEMINI_API_KEY is missing or empty",
      },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Respond with OK" }] }],
    });
    const raw = result.response.text();
    return NextResponse.json({
      ok: true,
      env: presence,
      key_used: "GEMINI_API_KEY",
      key_prefix: key.slice(0, 6),
      model: getGeminiModelId(),
      raw_response: raw ?? null,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json(
      {
        ok: false,
        env: presence,
        key_used: "GEMINI_API_KEY",
        key_prefix: key.slice(0, 6),
        model: getGeminiModelId(),
        error_name: err.name,
        error_message: err.message,
        error_includes_429: err.message.includes("429"),
      },
      { status: 502 }
    );
  }
}
