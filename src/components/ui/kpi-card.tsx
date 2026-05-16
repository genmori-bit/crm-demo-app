/**
 * KpiCard — 後方互換性を維持しつつ新デザインへ移行
 *
 * 新規実装は MetricCard / MetricStrip (metric-card.tsx) を使用してください。
 * このコンポーネントは既存コードとの後方互換のために維持します。
 */

import Link from "next/link";
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

// subtle top-border accent (2px) — 太い左ラインの廃止
const accentTop: Record<string, string> = {
  default: "",
  primary: "border-t-2 border-t-primary-400",
  success: "border-t-2 border-t-success",
  warning: "border-t-2 border-t-warning",
  danger:  "border-t-2 border-t-danger",
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  trend,
  accent = "primary",
  href,
  className,
}: KpiCardProps) {
  const topAccent = accentTop[accent] ?? "";

  const valueStr = String(value);
  const valueClass = cn(
    "font-bold text-sf-text tabular-nums leading-none",
    valueStr.length <= 7  ? "text-[1.375rem]" :
    valueStr.length <= 10 ? "text-lg" :
    "text-base"
  );

  const cardClass = cn(
    "bg-sf-surface rounded-lg border border-sf-border",
    "shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] px-4 py-3.5",
    topAccent,
    href && "cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all",
    className
  );

  const iconEl = icon ? (
    <span className="text-sf-weak/50 shrink-0 ml-2" aria-hidden="true">
      {/* render lucide icon or svg at small size */}
      <span className="[&>svg]:w-4 [&>svg]:h-4 [&>*]:w-4 [&>*]:h-4">{icon}</span>
    </span>
  ) : null;

  const content = (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs font-medium text-sf-text/60 leading-none truncate">{label}</p>
        {iconEl}
      </div>

      {/* Value */}
      <p className={valueClass}>{value}</p>

      {/* Sub / trend */}
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.positive ? "text-success" : "text-danger"
            )}>
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                {trend.positive ? (
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
              {trend.value}
            </span>
          )}
          {sub && <span className="text-xs text-sf-weak leading-snug">{sub}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className={cardClass}>{content}</Link>;
  }
  return <div className={cardClass}>{content}</div>;
}
