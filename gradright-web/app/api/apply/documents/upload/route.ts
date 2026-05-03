import {
  createServerClient,
  createServiceRoleSupabaseClient,
} from "@/lib/db/supabase";
import { ensureUserFromAuth } from "@/lib/db/queries/users";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

const BUCKET = "loan-documents";

export async function POST(request: Request): Promise<NextResponse> {
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

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${appUser.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    const admin = createServiceRoleSupabaseClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("[loan upload]", error);
      return NextResponse.json(
        apiError(
          "Could not upload file. Ensure the loan-documents bucket exists and service role is configured."
        ),
        { status: 503 }
      );
    }

    return NextResponse.json(
      apiSuccess({
        storage_path: path,
        file_name: file.name,
        bucket: BUCKET,
      })
    );
  } catch (e) {
    console.error("[loan upload]", e);
    return NextResponse.json(apiError("Upload failed"), { status: 500 });
  }
}
