import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  gradient,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stronger frosted gradient panel (hero cards). */
  gradient?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 backdrop-blur-xl",
        gradient
          ? "bg-gradient-to-br from-background/85 via-background/65 to-muted/35 shadow-elegant"
          : "glass shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
