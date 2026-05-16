"use client";

import Link from "next/link";
import { resolveRecordRoute, type AppContext } from "@/lib/route-resolver";
import { cn } from "@/lib/utils";

interface RecordLinkProps {
  /** Salesforce / CRM オブジェクト種別 ("Contact", "Deal", "Case" 等) */
  objectApiName: string;
  recordId: string;
  label: string | null | undefined;
  /** label が null/undefined のときに表示するフォールバック */
  fallbackLabel?: string;
  appContext?: AppContext;
  className?: string;
  /** true にするとテキスト表示のみ（リンク無効化） */
  disabled?: boolean;
}

/**
 * RecordLink
 *
 * objectApiName + recordId からURLを解決し、
 * - ルートが存在する → <Link> として表示
 * - ルートが存在しない / disabled → plain text として表示
 *
 * クリックできないものを青色リンク風に見せない責務を持つ。
 */
export function RecordLink({
  objectApiName,
  recordId,
  label,
  fallbackLabel = "—",
  appContext,
  className,
  disabled = false,
}: RecordLinkProps) {
  const displayLabel = label ?? fallbackLabel;
  const href = disabled ? null : resolveRecordRoute(objectApiName, recordId, appContext);

  if (!href) {
    return (
      <span className={cn("text-sf-text", className)}>
        {displayLabel}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "text-primary-600 hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm",
        className,
      )}
    >
      {displayLabel}
    </Link>
  );
}

/**
 * UserLink — User オブジェクト専用の短縮形
 */
export function UserLink({
  userId,
  name,
  className,
}: {
  userId: string;
  name: string | null | undefined;
  className?: string;
}) {
  return (
    <RecordLink
      objectApiName="User"
      recordId={userId}
      label={name}
      fallbackLabel="未設定"
      className={className}
    />
  );
}
