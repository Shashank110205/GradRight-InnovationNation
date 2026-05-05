import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GRE estimator",
  description: "Target GRE bands grounded in profile hub and program requirements",
};

export default function GreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
