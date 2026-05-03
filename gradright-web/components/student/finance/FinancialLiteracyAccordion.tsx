"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECTIONS = [
  {
    id: "how-loans-work",
    title: "How education loans work",
    body: `Most education loans pay the college directly in chunks, based on fee notices. You usually pay only simple interest during study if the lender allows it; later you repay in fixed monthly amounts called EMIs.

Rates and fees vary by lender. Always read the sanction letter: it lists the rate, how money is released, and what happens if you need more time to finish the course.`,
  },
  {
    id: "80e",
    title: "Section 80E",
    body: `If you take a loan for higher education from a qualifying lender, the interest you pay can often be claimed as a deduction under Section 80E for several years. The rules and limits change with the budget, so ask a chartered accountant what applies to your family.

Keep bank statements and interest certificates. The benefit is about lowering taxable income—it is separate from tuition receipts you might use for other deductions.`,
  },
  {
    id: "moratorium",
    title: "Moratorium period",
    body: `A moratorium is a window where you are not required to pay the main EMI—often while you study and sometimes for a few months after. Interest may still add up on some products, so ask the lender to explain it with a simple rupee example.

Know the exact date when full EMIs start, and whether small interest payments are needed during study.`,
  },
  {
    id: "collateral",
    title: "Collateral vs clean loans",
    body: `A collateral loan is backed by an asset such as property. It can sometimes unlock a larger amount or a lower rate, but paperwork is heavier and the asset is at risk if payments stop.

A clean or unsecured loan does not need property pledged, but the approved amount may be smaller and the rate higher. Compare total cost—not just the headline rate—including processing fees and insurance.`,
  },
  {
    id: "compare-offers",
    title: "How to compare offers",
    body: `Use a short checklist: total interest over the full tenure, processing fee, prepayment rules, how top-ups work, how fast money reaches the college, and service quality if you need help abroad.

Get two or three sanction letters, then line them up on the same loan amount and tenure so the EMI and total payout are easy to compare.`,
  },
] as const;

export function FinancialLiteracyAccordion() {
  return (
    <Card size="sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Money basics</CardTitle>
        <CardDescription>
          Short reads in everyday language—verify details with your lender or tax
          advisor.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Accordion type="single" collapsible className="w-full">
          {SECTIONS.map((s) => (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger className="text-left text-sm">
                {s.title}
              </AccordionTrigger>
              <AccordionContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {s.body}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
