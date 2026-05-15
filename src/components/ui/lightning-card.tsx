import { cn } from "@/lib/utils";

interface LightningCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LightningCard({ children, className }: LightningCardProps) {
  return (
    <div
      className={cn(
        "bg-sf-surface rounded-sf border border-sf-border shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  count?: number;
}

export function LightningCardHeader({ title, subtitle, action, icon, count, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-sf-border bg-sf-surface rounded-t-sf",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="text-primary-500 shrink-0">{icon}</span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-sf-text truncate">{title}</h3>
            {count !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-2xs font-semibold bg-sf-bg text-sf-weak border border-sf-border rounded-full tabular-nums">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-sf-weak mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 shrink-0 ml-3">{action}</div>}
    </div>
  );
}

export function LightningCardBody({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn(!noPadding && "px-4 py-4", className)}>
      {children}
    </div>
  );
}

export function LightningCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3 border-t border-sf-border bg-sf-bg rounded-b-sf text-xs text-sf-weak", className)}>
      {children}
    </div>
  );
}
