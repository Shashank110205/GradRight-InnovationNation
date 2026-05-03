import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  gradient,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-3xl border p-5",
        gradient
          ? "border-brand-primary/25 bg-gradient-to-br from-background/90 via-background/70 to-brand-primary/10 shadow-elegant"
          : "glass-strong shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
