"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import type { GamificationAction } from "@/lib/types";

export type AwardXPResponse = {
  new_xp_total: number;
  badge_unlocked: string | null;
};

async function postAwardXP(
  action: GamificationAction
): Promise<AwardXPResponse> {
  const res = await fetch("/api/user/award-xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const json: unknown = await res.json();
  if (
    typeof json !== "object" ||
    json === null ||
    !("success" in json) ||
    typeof (json as { success: unknown }).success !== "boolean"
  ) {
    throw new Error("Invalid response");
  }
  const body = json as {
    success: boolean;
    data?: AwardXPResponse;
    error?: string;
  };
  if (!body.success || !body.data) {
    throw new Error(body.error ?? "Award XP failed");
  }
  return body.data;
}

/** React Query mutation for POST `/api/user/award-xp` (module first-visit / key actions). */
export function useAwardXP() {
  const router = useRouter();

  return useMutation({
    mutationFn: postAwardXP,
    onSuccess: () => {
      router.refresh();
    },
  });
}
