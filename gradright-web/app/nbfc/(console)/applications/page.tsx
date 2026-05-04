import { ApplicationsPageClient } from "@/components/partner/ApplicationsPageClient";
import { NbfcCommandCenter } from "@/components/partner/NbfcCommandCenter";
import { getNBFCApplications } from "@/lib/db/queries/applications";
import { NBFC_DEMO_PIPELINE } from "@/lib/partner/nbfc-demo-leads";
import type { LoanApplicationStatus, RiskLabel } from "@/lib/types";

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

const RISKS = new Set<RiskLabel>(["low", "medium", "high"]);
const STATUSES = new Set<LoanApplicationStatus>([
  "submitted",
  "under_review",
  "manual_review",
  "approved",
  "rejected",
]);

export default async function NbfcApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const riskRaw = firstParam(sp.risk);
  const statusRaw = firstParam(sp.status);
  const country = firstParam(sp.country);
  const program = firstParam(sp.program);

  const risk = RISKS.has(riskRaw as RiskLabel) ? (riskRaw as RiskLabel) : undefined;
  const status = STATUSES.has(statusRaw as LoanApplicationStatus)
    ? (statusRaw as LoanApplicationStatus)
    : undefined;

  const items = await getNBFCApplications({
    risk_label: risk ? [risk] : undefined,
    status: status ? [status] : undefined,
    target_country: country || undefined,
    program_type: program || undefined,
    includeDrafts: false,
  });

  const showDemo = items.length === 0;
  const heroItems = showDemo ? NBFC_DEMO_PIPELINE : items;

  return (
    <div className="space-y-8">
      <NbfcCommandCenter items={heroItems} isDemo={showDemo} />
      <ApplicationsPageClient
        items={items}
        query={{
          risk: risk ?? "",
          status: status ?? "",
          country,
          program,
        }}
      />
    </div>
  );
}
