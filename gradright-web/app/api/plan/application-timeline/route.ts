import {
  buildRuleBasedApplicationTimeline,
  generateApplicationTimeline,
} from "@/lib/ai/generate-application-timeline";
import { createServerClient } from "@/lib/db/supabase";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;

const postBodySchema = z.object({
  targetIntake: z.string().min(1),
  targetCountry: z.string().min(1),
  targetUniversities: z.array(z.string()),
  currentDate: z.string().min(1),
  profileData: z.record(z.unknown()),
  fastMode: z.boolean().optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !authUser) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON"), { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      apiError(parsed.error.issues.map((e) => e.message).join("; ")),
      { status: 400 }
    );
  }

  const { fastMode, ...timelineInput } = parsed.data;
  const timeline =
    fastMode === true
      ? {
          data: buildRuleBasedApplicationTimeline(timelineInput),
          source: "fallback" as const,
        }
      : await generateApplicationTimeline(timelineInput);

  return NextResponse.json(
    apiSuccess({ ...timeline.data, source: timeline.source, kind: "application_timeline" as const })
  );
}
