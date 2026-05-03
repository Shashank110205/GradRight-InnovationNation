import { updateApplicationDecision } from "@/lib/db/queries/applications";
import { requireNbfcSupervisorApi } from "@/lib/nbfc/require-nbfc-api";
import type { NBFCDecision } from "@/lib/types";
import { apiError, apiSuccess } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  decision: z.enum(["approved", "rejected", "manual_review"]),
  notes: z.string().max(4000).optional().nullable(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireNbfcSupervisorApi();
  if ("error" in auth) {
    return NextResponse.json(apiError(auth.error), { status: auth.status });
  }

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(apiError("Invalid JSON body"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(apiError("Invalid request body"), {
      status: 400,
    });
  }

  const { decision, notes } = parsed.data;

  try {
    const updated = await updateApplicationDecision(
      id,
      decision as NBFCDecision,
      auth.appUser.id,
      notes
    );
    if (!updated) {
      return NextResponse.json(apiError("Application not found"), {
        status: 404,
      });
    }
    return NextResponse.json(apiSuccess(updated));
  } catch (e) {
    console.error("[PATCH /api/nbfc/applications/[id]/decision]", e);
    return NextResponse.json(apiError("Could not save decision"), {
      status: 500,
    });
  }
}
