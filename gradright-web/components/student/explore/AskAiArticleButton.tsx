"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AskAiArticleButton({ seed }: { seed: string }) {
  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant: "default" }),
        "inline-flex gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
      )}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent<{ text: string }>("gr-mentor-prefill", {
            detail: { text: seed },
          })
        );
      }}
    >
      Ask GradRight AI
    </button>
  );
}
