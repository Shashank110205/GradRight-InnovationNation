import type { NextResponse } from "next/server";
import { buildProfileDeepeningResponse } from "@/lib/features/feature-payloads";
import { requireStudentFeatureAuth } from "@/lib/features/student-auth";
import { jsonFeatureResponse } from "@/lib/features/json-feature-response";

export async function POST(): Promise<NextResponse> {
  const auth = await requireStudentFeatureAuth();
  if (!auth.ok) return auth.response;
  const data = await buildProfileDeepeningResponse(auth.ctx);
  return jsonFeatureResponse(auth.ctx, data);
}
