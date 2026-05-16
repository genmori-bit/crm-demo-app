import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy/MM/dd", { locale: ja });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy/MM/dd HH:mm", { locale: ja });
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** KPIカード用: 大きな数値を万/億単位で短縮表示 */
export function formatAmountCompact(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount === 0) return "¥0";
  const abs = Math.abs(amount);
  if (abs >= 1_0000_0000) {
    const v = amount / 1_0000_0000;
    return `¥${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}億`;
  }
  if (abs >= 1_0000) {
    const v = amount / 1_0000;
    return `¥${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

// ── Metric format functions ──────────────────────────────────────────────────

/**
 * 金額を短縮表示する (万/億)
 * 600000   → ¥60万
 * 14620000 → ¥1,462万
 * 44577    → ¥4.5万
 * 0        → ¥0
 * null     → —
 */
export function formatCurrencyShort(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount === 0) return "¥0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_0000_0000) {
    const v = abs / 1_0000_0000;
    const s = v % 1 === 0 ? v.toFixed(0) : parseFloat(v.toFixed(1)).toString();
    return `${sign}¥${s}億`;
  }
  if (abs >= 1_0000) {
    const v = abs / 1_0000;
    const rounded = Math.round(v * 10) / 10;
    const s =
      rounded % 1 === 0
        ? new Intl.NumberFormat("ja-JP").format(Math.round(rounded))
        : new Intl.NumberFormat("ja-JP", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(rounded);
    return `${sign}¥${s}万`;
  }
  return `${sign}¥${new Intl.NumberFormat("ja-JP").format(abs)}`;
}

/** 件数などの数値を短縮表示 (1000以上は "1K" ではなく "1,000" — 日本語UIはカンマ区切り) */
export function formatNumberShort(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ja-JP").format(value);
}

/** パーセント表示 (小数1桁) */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null) return "—";
  return `${value.toFixed(decimals)}%`;
}

/** スコア表示 (整数) */
export function formatScore(value: number | null | undefined): string {
  if (value == null) return "—";
  return Math.round(value).toString();
}

export type MetricFormat = "currency" | "currency_short" | "number" | "percent" | "score" | "text";

/** 統一フォーマット関数 */
export function formatMetricValue(
  value: number | string | null | undefined,
  format: MetricFormat = "text",
  unit?: string
): string {
  if (value == null) return "—";
  if (format === "text") return String(value) + (unit ? ` ${unit}` : "");
  if (typeof value !== "number") return String(value);

  let result: string;
  switch (format) {
    case "currency":        result = formatAmount(value); break;
    case "currency_short":  result = formatCurrencyShort(value); break;
    case "number":          result = formatNumberShort(value); break;
    case "percent":         result = formatPercent(value); break;
    case "score":           result = formatScore(value); break;
    default:                result = String(value);
  }
  return unit ? `${result} ${unit}` : result;
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isBefore(startOfDay(new Date(date)), startOfDay(new Date()));
}

export function isDueSoon(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);
  return isAfter(d, startOfDay(now)) && isBefore(d, startOfDay(threeDaysLater));
}
