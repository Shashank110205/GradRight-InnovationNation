import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your GradRight command center — powered by profile hub and live scoring.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
