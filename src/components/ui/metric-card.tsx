"use client";

/**
 * Metric UI コンポーネント群
 *
 * MetricCard   — カード型KPI表示 (Dashboard用)
 * MetricStrip  — 横並びの指標サマリー (Record Header下用)
 * MetricItem   — MetricStrip内の1項目
 * MetricGrid   — MetricCardをグリッド配置するラッパー
 */

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────

export type MetricTone = "neutral" | "brand" | "success" | "warning" | "danger";
export type MetricEmphasis = "low" | "medium" | "high";

const TONE_ACCENT: Record<MetricTone, string> = {
  neutral: "border-t-sf-border",
  brand:   "border-t-primary-400",
  success: "border-t-success",
  warning: "border-t-warning",
  danger:  "border-t-danger",
};

const TONE_LABEL: Record<MetricTone, string> = {
  neutral: "text-sf-weak",
  brand:   "text-primary-600",
  success: "text-success",
  warning: "text-warning",
  danger:  "text-danger",
};

const TONE_BADGE_BG: Record<MetricTone, string> = {
  neutral: "bg-sf-bg text-sf-weak",
  brand:   "bg-info-light text-primary-600",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger:  "bg-danger-light text-danger",
};

// ── MetricBadge ───────────────────────────────────────────────────────────────

interface MetricBadgeProps {
  label: string;
  tone?: MetricTone;
}

export function MetricBadge({ label, tone = "neutral" }: MetricBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none",
      TONE_BADGE_BG[tone]
    )}>
      {label}
    </span>
  );
}

// ── MetricTrend ───────────────────────────────────────────────────────────────

interface MetricTrendProps {
  value: string;
  positive: boolean;
  label?: string;
}

export function MetricTrend({ value, positive, label }: MetricTrendProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium",
      positive ? "text-success" : "text-danger"
    )}>
      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        {positive ? (
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        )}
      </svg>
      {value}
      {label && <span className="text-sf-weak font-normal ml-0.5">{label}</span>}
    </span>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  description?: string;
  trend?: { value: string; positive: boolean; label?: string };
  status?: { label: string; tone: MetricTone };
  icon?: React.ReactNode;
  tone?: MetricTone;
  emphasis?: MetricEmphasis;
  href?: string;
  className?: string;
  "aria-label"?: string;
}

const VALUE_SIZE: Record<MetricEmphasis, string> = {
  high:   "text-[1.5rem] font-bold leading-none",
  medium: "text-xl font-semibold leading-none",
  low:    "text-base font-semibold leading-snug",
};

export function MetricCard({
  label,
  value,
  unit,
  subValue,
  description,
  trend,
  status,
  icon,
  tone = "neutral",
  emphasis = "medium",
  href,
  className,
  "aria-label": ariaLabel,
}: MetricCardProps) {
  const hasAccent = emphasis === "high" && tone !== "neutral";

  const inner = (
    <div
      className={cn(
        "bg-sf-surface border border-sf-border rounded-lg px-4 py-3.5 flex flex-col gap-2 h-full",
        hasAccent && "border-t-2",
        hasAccent && TONE_ACCENT[tone],
        href && "hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer",
        !href && "shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]",
        !href && className
      )}
      aria-label={ariaLabel ?? `${label}: ${value}${unit ? " " + unit : ""}`}
    >
      {/* Top row: label + optional status or icon */}
      <div className="flex items-start justify-between gap-2">
        <p className={cn(
          "text-xs font-medium leading-snug",
          emphasis === "low" ? "text-sf-weak" : "text-sf-text/70"
        )}>
          {label}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {status && <MetricBadge label={status.label} tone={status.tone} />}
          {icon && (
            <span className="text-sf-weak/60" aria-hidden="true">{icon}</span>
          )}
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "tabular-nums text-sf-text",
            VALUE_SIZE[emphasis]
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-sf-weak">{unit}</span>
        )}
      </div>

      {/* Bottom: sub / trend / description */}
      {(subValue || trend || description) && (
        <div className="flex items-center gap-2 flex-wrap">
          {trend && <MetricTrend {...trend} />}
          {subValue && (
            <span className="text-xs text-sf-weak leading-snug">{subValue}</span>
          )}
          {description && !subValue && (
            <span className="text-xs text-sf-weak leading-snug">{description}</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block h-full", className)}>
        {inner}
      </Link>
    );
  }
  return inner;
}

// ── MetricGrid ────────────────────────────────────────────────────────────────

interface MetricGridProps {
  children: React.ReactNode;
  /** Number of columns on large screens (default 4) */
  cols?: 3 | 4 | 5 | 6;
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function MetricGrid({ children, cols = 4, className }: MetricGridProps) {
  return (
    <div className={cn("grid gap-3", GRID_COLS[cols], className)}>
      {children}
    </div>
  );
}

// ── MetricItem (for MetricStrip) ─────────────────────────────────────────────

interface MetricItemProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: MetricTone;
  emphasis?: "low" | "medium" | "high";
  href?: string;
}

function MetricItemInner({ label, value, sub, tone = "neutral", emphasis = "medium" }: MetricItemProps) {
  return (
    <div className="px-4 py-3 min-w-0 flex-1">
      <p className="text-xs font-medium text-sf-weak leading-none mb-1.5 truncate">{label}</p>
      <p className={cn(
        "tabular-nums font-semibold text-sf-text truncate leading-none",
        emphasis === "high" ? "text-base" : "text-sm",
        tone === "danger" && value !== "0件" && value !== "0" && "text-danger",
        tone === "warning" && "text-warning",
        tone === "success" && "text-success",
      )}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-sf-weak mt-1 leading-snug truncate">{sub}</p>
      )}
    </div>
  );
}

// ── MetricStrip ───────────────────────────────────────────────────────────────

/**
 * Record Header直下のAccount状態サマリー用
 * 単一の白コンテナ内に複数の指標を横並びで表示
 */
interface MetricStripProps {
  items: MetricItemProps[];
  className?: string;
}

export function MetricStrip({ items, className }: MetricStripProps) {
  return (
    <div
      className={cn(
        "bg-sf-surface border border-sf-border rounded-lg overflow-hidden",
        "flex flex-wrap divide-sf-border",
        className
      )}
      role="list"
      aria-label="主要指標"
    >
      {items.map((item, i) => (
        <div
          key={i}
          role="listitem"
          className={cn(
            "flex-1 min-w-[120px]",
            // 境界線: 右側 (最後は除く) + モバイルでは下側
            i < items.length - 1 && "border-r border-b sm:border-b-0 border-sf-border"
          )}
        >
          {item.href ? (
            <Link href={item.href} className="block hover:bg-sf-bg/50 transition-colors">
              <MetricItemInner {...item} />
            </Link>
          ) : (
            <MetricItemInner {...item} />
          )}
        </div>
      ))}
    </div>
  );
}
