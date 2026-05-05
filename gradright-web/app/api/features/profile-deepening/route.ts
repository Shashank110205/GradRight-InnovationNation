import { buildProfileDeepeningResponse } from "@/lib/features/feature-payloads";
import { requireStudentFeatureAuth } from "@/lib/features/student-auth";
import { apiSuccessMeta } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const auth = await requireStudentFeatureAuth();
  if (!auth.ok) return auth.response;
  const data = await buildProfileDeepeningResponse(auth.ctx);
  return NextResponse.json(apiSuccessMeta(data, { feature: "profile-deepening" }), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
