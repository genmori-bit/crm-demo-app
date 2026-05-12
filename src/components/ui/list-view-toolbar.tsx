"use client";

import { cn } from "@/lib/utils";

interface ListViewToolbarProps {
  total?: number;
  objectLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh?: () => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ListViewToolbar({
  total,
  objectLabel,
  searchValue,
  onSearchChange,
  onRefresh,
  filters,
  actions,
  className,
}: ListViewToolbarProps) {
  return (
    <div className={cn("bg-sf-surface border-b border-sf-border px-4 py-2.5 flex items-center gap-3 flex-wrap", className)}>
      {/* Count */}
      {total !== undefined && (
        <span className="text-xs text-sf-weak font-medium shrink-0 whitespace-nowrap">
          {total.toLocaleString("ja-JP")}件の{objectLabel}
        </span>
      )}

      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`${objectLabel}を検索...`}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
            aria-label={`${objectLabel}を検索`}
          />
        </div>

        {/* Extra filters */}
        {filters}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-sf text-sf-weak hover:bg-sf-bg border border-sf-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200"
            aria-label="更新"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
