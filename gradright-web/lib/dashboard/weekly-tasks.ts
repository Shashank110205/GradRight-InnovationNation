import type { JourneyStage } from "@/lib/types";
import type { StudentProfile } from "@/lib/types";

export type WeeklyTaskStatus = "overdue" | "due_soon" | "upcoming";

export type WeeklyTask = {
  id: string;
  title: string;
  dueDate: string;
  status: WeeklyTaskStatus;
  xpReward: number;
  stage: JourneyStage;
};

function addDaysYmd(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseIntakeHint(profile: StudentProfile | null): number {
  const raw = profile?.target_intake?.trim() ?? "";
  const y = raw.match(/(20\d{2})/);
  if (y) return Number(y[1]);
  return new Date().getUTCFullYear() + 1;
}

/**
 * Deterministic “journey milestones” for the MVP (no `journey_steps` table).
 * Dates are anchored from today plus profile intake year for variety.
 */
export function buildWeeklyTasks(
  profile: StudentProfile | null,
  journeyStage: JourneyStage
): WeeklyTask[] {
  const now = new Date();
  const year = parseIntakeHint(profile);
  const offset = (year % 5) - 2;

  const overdue: WeeklyTask = {
    id: `wt-${journeyStage}-docs`,
    title:
      journeyStage === "discover"
        ? "Finish academic profile gaps (CGPA, tests, internships)"
        : journeyStage === "plan"
          ? "Lock your reach / match / safe university shortlist"
          : journeyStage === "finance"
            ? "Upload income proof + co-borrower details for pre-read"
            : journeyStage === "apply"
              ? "Complete loan application checklist (PAN, offer, bank statements)"
              : "Log a placement or internship outcome for your risk refresh",
    dueDate: addDaysYmd(now, -5 - offset),
    status: "overdue",
    xpReward: 25,
    stage: journeyStage,
  };

  const dueSoon: WeeklyTask = {
    id: `wt-${journeyStage}-prep`,
    title:
      journeyStage === "plan"
        ? "Run admission predictor refresh with latest scores"
        : journeyStage === "finance"
          ? "Model EMI comfort vs. low/high salary scenarios"
          : journeyStage === "apply"
            ? "Confirm co-borrower availability and KYC window"
            : journeyStage === "succeed"
              ? "Add a new certification or project to your profile"
              : "Add target universities and intake to sharpen timelines",
    dueDate: addDaysYmd(now, 3 + offset),
    status: "due_soon",
    xpReward: 20,
    stage: journeyStage,
  };

  const upcoming: WeeklyTask = {
    id: `wt-${journeyStage}-ahead`,
    title:
      journeyStage === "finance" || journeyStage === "apply"
        ? "Schedule a document review before submission"
        : "Review visa + intake milestones for the next 90 days",
    dueDate: addDaysYmd(now, 14 + offset),
    status: "upcoming",
    xpReward: 15,
    stage: journeyStage,
  };

  return [overdue, dueSoon, upcoming];
}
