import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FabCard({
  children,
  className,
  onClick,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const Comp = as as any;
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-[var(--shadow-card)] text-left w-full",
        onClick && "transition-transform duration-200 active:scale-[0.97] hover:border-primary/40",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="font-heading text-lg font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{ backgroundImage: "var(--gradient-3d)" }}
    >
      {children}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-muted/70 px-3 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 py-12 px-6 text-center">
      <div className="mb-3 text-primary">{icon}</div>
      <p className="font-heading font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function Processing({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/60 bg-card/60 py-12">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full blur-xl opacity-70" style={{ background: "var(--gradient-3d)" }} />
        <div className="relative h-14 w-14 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>
    </div>
  );
}
