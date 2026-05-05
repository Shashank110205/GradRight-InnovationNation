import { buildHomeFeatureData } from "@/lib/features/feature-payloads";
import { jsonFeatureResponse } from "@/lib/features/json-feature-response";
import { requireStudentFeatureAuth } from "@/lib/features/student-auth";
import type { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const auth = await requireStudentFeatureAuth();
  if (!auth.ok) return auth.response;
  const data = await buildHomeFeatureData(auth.ctx);
  return jsonFeatureResponse(auth.ctx, data);
}
