import { placementIntelMetaSchema } from "@/lib/onboarding/onboarding-answers-schema";
import type { z } from "zod";

export type PlacementIntelMeta = z.infer<typeof placementIntelMetaSchema>;

export function parsePlacementIntelFromSnapshot(
  snapshot: Record<string, unknown> | null | undefined
): PlacementIntelMeta | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const raw = snapshot._placement_intel;
  const parsed = placementIntelMetaSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
