import type { Metadata } from "next";
import Link from "next/link";

import { CareerNavigatorClient } from "@/components/student/career/CareerNavigatorClient";

export const metadata: Metadata = {
  title: "Find Your Best University",
  description: "AI Career Navigator for Indian students planning abroad.",
};

export default function CareerNavigatorPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/career" className="hover:text-foreground">
          Career & placement
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Navigator</span>
      </nav>

      <CareerNavigatorClient />

      <p className="max-w-2xl text-xs text-muted-foreground">
        Estimates are illustrative. Verify tuition, living costs, visa categories,
        and employment outcomes on official university and government sources.
      </p>
    </div>
  );
}
