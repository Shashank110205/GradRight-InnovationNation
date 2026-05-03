import { getNBFCApplicationDetailForSupervisor } from "@/lib/db/queries/applications";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  const { id } = await ctx.params;
  try {
    const detail = await getNBFCApplicationDetailForSupervisor(id);
    if (!detail) {
      return NextResponse.json(apiError("Application not found"), {
        status: 404,
      });
    }
    return NextResponse.json(apiSuccess(detail));
  } catch (e) {
    console.error("[GET /api/nbfc/applications/[id]]", e);
    return NextResponse.json(apiError("Could not load application"), {
      status: 500,
    });
  }
}
