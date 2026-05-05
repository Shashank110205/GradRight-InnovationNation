/** PDF text extraction — dynamic import avoids webpack/RSC init crash from static `pdf-parse` + pdfjs-dist. */

export async function extractPdfText(buf: Buffer): Promise<string> {
  try {
    const mod = await import("pdf-parse");
    const PDFParse = (mod as { PDFParse?: unknown }).PDFParse;

    if (typeof PDFParse !== "function") {
      return "";
    }

    const parser = new (PDFParse as new (opts: { data: Buffer }) => {
      getText: () => Promise<{ text?: string }>;
      destroy: () => Promise<void>;
    })({ data: buf });
    const textResult = await parser.getText();
    await parser.destroy().catch(() => {});

    return textResult.text?.replace(/\s+/g, " ").trim() ?? "";
  } catch {
    return "";
  }
}
