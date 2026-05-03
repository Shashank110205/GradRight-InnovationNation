import { getNBFCPortfolioData } from "@/lib/db/queries/applications";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  try {
    const data = await getNBFCPortfolioData();
    return NextResponse.json(apiSuccess(data));
  } catch (e) {
    console.error("[GET /api/nbfc/portfolio]", e);
    return NextResponse.json(apiError("Could not load portfolio"), {
      status: 500,
    });
  }
}
