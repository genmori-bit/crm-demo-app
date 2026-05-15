import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode | EmptyStateAction;
  icon?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

function isActionObject(v: unknown): v is EmptyStateAction {
  return typeof v === "object" && v !== null && "label" in v && "onClick" in v;
}

export function EmptyState({ title, description, action, icon, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-in",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div className={cn(
        "rounded-full border border-sf-border flex items-center justify-center mb-4 bg-gradient-to-b from-white to-sf-bg shadow-sm",
        compact ? "w-10 h-10" : "w-14 h-14"
      )}>
        <span className={cn("text-sf-placeholder", compact ? "[&>svg]:w-5 [&>svg]:h-5" : "[&>svg]:w-7 [&>svg]:h-7")}>
          {icon ?? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </span>
      </div>
      <h3 className={cn("font-semibold text-sf-text", compact ? "text-xs" : "text-sm")}>{title}</h3>
      {description && (
        <p className={cn("text-sf-weak mt-1 max-w-xs leading-relaxed", compact ? "text-xs" : "text-xs mt-1.5")}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {isActionObject(action) ? (
            <button
              onClick={action.onClick}
              className="px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 active:bg-primary-700 transition-colors shadow-sm"
            >
              {action.label}
            </button>
          ) : action}
        </div>
      )}
    </div>
  );
}
