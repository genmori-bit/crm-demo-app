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
