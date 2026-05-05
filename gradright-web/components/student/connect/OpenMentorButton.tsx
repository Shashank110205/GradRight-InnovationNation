"use client";

import { MessageCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OpenMentorButton({
  className,
  label = "Open Mentor Companion",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      className={cn(
        buttonVariants({ variant: "default" }),
        "gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95",
        className
      )}
      onClick={() => {
        window.dispatchEvent(new Event("gr-open-mentor"));
      }}
    >
      <MessageCircle className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
