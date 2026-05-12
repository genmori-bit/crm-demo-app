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
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function LightningCardHeader({ title, action, icon, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-sf-border",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-primary-500 shrink-0">{icon}</span>
        )}
        <h3 className="text-sm font-semibold text-sf-text">{title}</h3>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
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
    <div className={cn(!noPadding && "px-4 py-3", className)}>
      {children}
    </div>
  );
}
