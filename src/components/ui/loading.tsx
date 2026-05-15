import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-14", className)} role="status" aria-label="読み込み中">
      <svg className="h-7 w-7 animate-spin text-primary-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function PageLoading() {
  return <LoadingSpinner className="h-48" />;
}

export function InlineLoading({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-sf-weak" role="status">
      <svg className="h-4 w-4 animate-spin text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  const widths = ["w-32", "w-48", "w-24", "w-20", "w-16", "w-28"];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={cn("h-4 skeleton", widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-4 space-y-3 animate-in">
      <div className="h-4 skeleton w-1/3" />
      <div className="h-7 skeleton w-1/2" />
      <div className="h-3 skeleton w-2/3" />
    </div>
  );
}
