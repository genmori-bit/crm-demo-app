import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const accentClasses = {
  default: "border-l-sf-border",
  primary: "border-l-primary-500",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  trend,
  accent = "primary",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-sf-surface rounded-sf border border-sf-border shadow-card px-5 py-4 border-l-4",
        accentClasses[accent],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-sf-weak uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-sf-text leading-none">{value}</p>
          {sub && (
            <p className="text-xs text-sf-weak mt-1">{sub}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              <svg
                className={cn(
                  "w-3 h-3",
                  trend.positive ? "text-success" : "text-danger"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                {trend.positive ? (
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-success" : "text-danger"
                )}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-sf bg-sf-bg border border-sf-border flex items-center justify-center text-sf-weak shrink-0 ml-3">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
