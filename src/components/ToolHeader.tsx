import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";

interface ToolHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  backTo?: string;
  iconAccent?: string; // tailwind text color class
  action?: ReactNode;
}

/**
 * Unified header for every tool page in Ultimate Creator Studio.
 * Minimal, consistent, fast — replaces the old per-page custom headers.
 */
export default function ToolHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  backTo = "/dashboard",
  iconAccent = "ucs-accent",
  action,
}: ToolHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <button
          onClick={() => navigate(backTo)}
          aria-label="Back"
          className="ucs-card w-9 h-9 inline-flex items-center justify-center shrink-0 hover:ucs-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="ucs-card w-10 h-10 inline-flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${iconAccent}`} />
        </div>
        <div className="min-w-0">
          {badge && <span className="ucs-chip mb-1.5">{badge}</span>}
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight ucs-text leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm ucs-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
