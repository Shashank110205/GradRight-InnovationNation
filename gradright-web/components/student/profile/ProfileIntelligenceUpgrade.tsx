"use client";

import { ProfileIntelligenceGeminiChat } from "@/components/student/profile/ProfileIntelligenceGeminiChat";

/** Score-upgrade flow: Gemini chat + résumé extraction + profile save. */
export function ProfileIntelligenceUpgrade() {
  return <ProfileIntelligenceGeminiChat />;
}
