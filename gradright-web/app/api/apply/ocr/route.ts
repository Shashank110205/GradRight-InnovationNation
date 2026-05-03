import {
  createServerClient,
  createServiceRoleSupabaseClient,
} from "@/lib/db/supabase";
import { ensureUserFromAuth } from "@/lib/db/queries/users";
import { extractLoanFieldsFromText } from "@/lib/apply/ocr-extract";
import { apiError, apiSuccess } from "@/lib/types";
import { DocumentOcrRequestSchema } from "@/lib/validations/loan-application";
import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const BUCKET = "loan-documents";

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = DocumentOcrRequestSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      apiError(
        parsed.error.flatten().formErrors.join("; ") || "Invalid body"
      ),
      { status: 400 }
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const appUser = await ensureUserFromAuth({
    id: authUser.id,
    email: authUser.email,
    user_metadata: authUser.user_metadata as { full_name?: string },
  });

  const { storage_path, document_type } = parsed.data;
  if (!storage_path.startsWith(`${appUser.id}/`)) {
    return NextResponse.json(apiError("Invalid storage path"), {
      status: 403,
    });
  }

  try {
    const admin = createServiceRoleSupabaseClient();
    const { data: blob, error: dlErr } = await admin.storage
      .from(BUCKET)
      .download(storage_path);

    if (dlErr || !blob) {
      console.error("[loan ocr] download", dlErr);
      return NextResponse.json(
        apiError("Could not read file from storage."),
        { status: 503 }
      );
    }

    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = blob.type || "";

    let rawText: string;
    if (mime.includes("pdf")) {
      rawText = buf.toString("utf8").slice(0, 4000);
      if (rawText.replace(/[^\x20-\x7E]/g, "").length < 40) {
        return NextResponse.json(
          apiError(
            "PDF text extraction is limited in this build. Please upload a PNG or JPG scan for OCR."
          ),
          { status: 400 }
        );
      }
    } else {
      const worker = await createWorker("eng");
      try {
        const {
          data: { text },
        } = await worker.recognize(buf);
        rawText = text ?? "";
      } finally {
        await worker.terminate();
      }
    }

    const fields = await extractLoanFieldsFromText(document_type, rawText);
    return NextResponse.json(apiSuccess({ fields, raw_text_preview: rawText.slice(0, 500) }));
  } catch (e) {
    console.error("[loan ocr]", e);
    return NextResponse.json(apiError("OCR processing failed"), {
      status: 500,
    });
  }
}
