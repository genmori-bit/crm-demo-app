export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-14 ${className ?? ""}`} role="status" aria-label="読み込み中">
      <svg className="h-7 w-7 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
      <svg className="h-4 w-4 animate-spin text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
