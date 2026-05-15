import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: "default" | "primary" | "success" | "warning" | "danger";
  href?: string;
  className?: string;
}

const accentConfig = {
  default: { bar: "border-l-sf-border", icon: "bg-sf-bg text-sf-weak border-sf-border" },
  primary: { bar: "border-l-primary-500", icon: "bg-info-light text-primary-500 border-info-border" },
  success: { bar: "border-l-success", icon: "bg-success-light text-success border-success-border" },
  warning: { bar: "border-l-warning", icon: "bg-warning-light text-warning border-warning-border" },
  danger:  { bar: "border-l-danger",  icon: "bg-danger-light text-danger border-danger-border" },
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
  const { bar, icon: iconClass } = accentConfig[accent];

  return (
    <div
      className={cn(
        "bg-sf-surface rounded-sf border border-sf-border shadow-card px-5 py-4 border-l-4 transition-shadow duration-150 hover:shadow-card-hover",
        bar,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-sf-weak uppercase tracking-wider mb-1.5 truncate">
            {label}
          </p>
          <p className="text-[1.625rem] font-bold text-sf-text leading-none tabular-nums">{value}</p>
          {sub && (
            <p className="text-xs text-sf-weak mt-1.5 leading-snug">{sub}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <svg
                className={cn("w-3 h-3 shrink-0", trend.positive ? "text-success" : "text-danger")}
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
              <span className={cn("text-xs font-semibold", trend.positive ? "text-success" : "text-danger")}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-sf border flex items-center justify-center shrink-0", iconClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
