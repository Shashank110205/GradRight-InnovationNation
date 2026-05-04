import { createServerClient, createServiceRoleSupabaseClient } from "@/lib/db/supabase";
import { getUserBySupabaseUID } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

/** Reuse existing bucket; path prefix isolates student profile resumes. */
const BUCKET = "loan-documents";
const PREFIX = "profile-resumes";

export async function POST(request: Request): Promise<NextResponse> {
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(apiError("Expected multipart form data"), {
      status: 400,
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(apiError("Missing file field"), { status: 400 });
  }

  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(apiError("File too large (max 8MB)"), { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${PREFIX}/${appUser.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    const admin = createServiceRoleSupabaseClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("[profile-resume upload]", error);
      return NextResponse.json(
        apiError(
          "Could not upload resume. Ensure storage is configured (same bucket as loan documents)."
        ),
        { status: 503 }
      );
    }

    return NextResponse.json(
      apiSuccess({
        storage_path: path,
        bucket: BUCKET,
        file_name: file.name,
      })
    );
  } catch (e) {
    console.error("[profile-resume upload]", e);
    return NextResponse.json(apiError("Upload failed"), { status: 500 });
  }
}
