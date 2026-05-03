import { createServerClient } from "@/lib/db/supabase";
import { runPlanAdmissionPrediction } from "@/lib/services/plan/admission.service";
import { apiError, apiSuccess } from "@/lib/types";
import {
  AdmissionPredictorPostSchema,
  type AdmissionPredictorResponse,
} from "@/lib/validations/plan";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type { AdmissionPredictorResponse };

export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsedBody = AdmissionPredictorPostSchema.safeParse(json ?? {});
  if (!parsedBody.success) {
    const msg =
      parsedBody.error.flatten().formErrors.join("; ") ||
      parsedBody.error.message ||
      "Invalid body";
    return NextResponse.json(apiError(msg), { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  try {
    const payload = await runPlanAdmissionPrediction(parsedBody.data);
    return NextResponse.json(apiSuccess(payload));
  } catch (e) {
    console.error("[POST /api/plan/admission]", e);
    const message =
      e instanceof Error ? e.message : "Admission prediction failed";
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
