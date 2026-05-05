import { buildLivingExpensesFeatureData } from "@/lib/features/feature-payloads";
import { requireStudentFeatureAuth } from "@/lib/features/student-auth";
import { apiSuccessMeta } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const auth = await requireStudentFeatureAuth();
  if (!auth.ok) return auth.response;
  const data = await buildLivingExpensesFeatureData(auth.ctx);
  return NextResponse.json(apiSuccessMeta(data, { feature: "living-expenses" }), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
