/** Predefined follow-ups shown after résumé extraction (same themes as profile-builder). */
export const PROFILE_INTEL_CHAT_SUGGESTIONS: readonly {
  id: string;
  label: string;
  prompt: string;
}[] = [
  {
    id: "five_year",
    label: "5-year vision",
    prompt:
      "Where do you see yourself in five years? (Be specific: role, geography, impact you want.)",
  },
  {
    id: "target_role",
    label: "Target role",
    prompt: "What is your target role or title for your first job after the degree?",
  },
  {
    id: "domain",
    label: "Domain focus",
    prompt: "Which domain or sub-field interests you most right now, and why?",
  },
  {
    id: "countries",
    label: "Target countries",
    prompt: "Which countries or regions are on your shortlist for grad school?",
  },
  {
    id: "priority",
    label: "Next 12 months",
    prompt: "What matters most for you in the next 12 months: prestige, salary, scholarship, affordability, or fastest placement?",
  },
];

export const PROFILE_INTEL_CHAT_INTRO = `I'm your **Profile Intelligence** coach (**Gemini**). Upload a PDF or TXT, run **Analyze résumé**, then **Save extraction to profile** so skills and projects sync to your record. After that, we will talk through goals here — and your replies are appended to your profile notes for the rest of GradRight.`;
