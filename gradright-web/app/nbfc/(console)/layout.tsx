import { redirect } from "next/navigation";

import { NbfcShellLoader } from "@/components/partner/nbfc-shell-loader";
import { getNbfcAuthContext } from "@/lib/nbfc/get-nbfc-auth";

export default async function NbfcConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getNbfcAuthContext();
  if (!ctx) {
    redirect("/sign-in");
  }

  const displayName =
    ctx.appUser.full_name?.trim() ||
    ctx.authUser.email?.split("@")[0] ||
    "Supervisor";

  return (
    <NbfcShellLoader
      supervisorName={displayName}
      supervisorEmail={ctx.authUser.email ?? ""}
    >
      {children}
    </NbfcShellLoader>
  );
}
