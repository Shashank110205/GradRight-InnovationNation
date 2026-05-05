/** Enable with GRADRIGHT_GEMINI_FORENSIC=1, or automatically when NODE_ENV !== production. */
export function isGeminiForensicLogging(): boolean {
  return (
    process.env.GRADRIGHT_GEMINI_FORENSIC === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export function logGeminiRequest(
  moduleName: string,
  apiKey: string | undefined,
  promptLength: number
): void {
  if (!isGeminiForensicLogging()) return;
  console.log("========== GEMINI REQUEST ==========");
  console.log("Module:", moduleName);
  console.log("API Key Used:", apiKey?.slice(0, 10));
  console.log("Prompt Length:", promptLength);
  console.log("Timestamp:", Date.now());
}

export function logGeminiError(moduleName: string, error: unknown): void {
  if (!isGeminiForensicLogging()) return;
  console.error("========== GEMINI ERROR ==========");
  console.error("Module:", moduleName);
  console.error(
    "Error Name:",
    error instanceof Error ? error.name : typeof error
  );
  console.error(
    "Error Message:",
    error instanceof Error ? error.message : String(error)
  );
  console.error("Full Error:", error);
}
