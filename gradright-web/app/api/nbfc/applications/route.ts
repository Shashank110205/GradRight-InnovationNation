import {
  getNBFCApplications,
} from "@/lib/db/queries/applications";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import { apiError, apiSuccess } from "@/lib/types";
import type { LoanApplicationStatus, RiskLabel } from "@/lib/types";
import { NextResponse } from "next/server";

function parseCsv<T extends string>(raw: string | null): T[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? (parts as T[]) : undefined;
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const risk_label = parseCsv<RiskLabel>(searchParams.get("risk_label"));
  const status = parseCsv<LoanApplicationStatus>(searchParams.get("status"));
  const target_country = searchParams.get("country") ?? undefined;
  const program_type = searchParams.get("program") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(
    200,
    Math.max(1, Number(searchParams.get("limit") ?? "100") || 100)
  );
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);

  try {
    const items = await getNBFCApplications({
      risk_label,
      status,
      target_country: target_country || undefined,
      program_type: program_type || undefined,
      search,
      limit,
      offset,
      includeDrafts: false,
    });
    return NextResponse.json(apiSuccess(items));
  } catch (e) {
    console.error("[GET /api/nbfc/applications]", e);
    return NextResponse.json(apiError("Could not load applications"), {
      status: 500,
    });
  }
}
