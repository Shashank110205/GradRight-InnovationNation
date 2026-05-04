import type { StudentProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StudentProfileSummary({
  profile,
}: {
  profile: StudentProfile | null;
}) {
  if (!profile) {
    return (
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base">Student profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-400">
          No onboarding profile on file for this applicant.
        </CardContent>
      </Card>
    );
  }

  const aspirationShort =
    profile.aspiration_text && profile.aspiration_text.length > 180
      ? `${profile.aspiration_text.slice(0, 177)}…`
      : (profile.aspiration_text ?? "");

  const rows: [string, string][] = [
    ["Profile completeness", `${profile.profile_completeness_score ?? 0}%`],
    ["Scholarship priority", profile.scholarship_priority?.replace(/_/g, " ") ?? "—"],
    ["Five-year goal", profile.five_year_goal?.trim() || "—"],
    ["Dream role", profile.dream_role?.trim() || "—"],
    ["Ambition / notes", aspirationShort.trim() || "—"],
    ["Institute (onboarding)", profile.institute_name ?? "—"],
    ["Institute tier", profile.institute_tier ?? "—"],
    ["Target country", profile.target_country ?? "—"],
    ["Degree / field", `${profile.degree_type ?? "—"} · ${profile.broad_field ?? "—"}`],
    ["CGPA", profile.cgpa != null ? `${profile.cgpa} / ${profile.cgpa_scale}` : "—"],
    ["Internships", String(profile.internship_count ?? 0)],
    ["Work experience (yrs)", String(profile.work_experience_years ?? 0)],
    ["GRE", profile.gre_score != null ? String(profile.gre_score) : "—"],
    ["IELTS", profile.ielts_score != null ? String(profile.ielts_score) : "—"],
  ];

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-base">Student profile</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {k}
            </p>
            <p className="text-sm text-slate-900 dark:text-slate-100">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
