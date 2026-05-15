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
