import { cn } from "@/lib/utils";

interface PageHeaderProps {
  objectIcon?: React.ReactNode;
  objectLabel: string;
  title: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  objectIcon,
  objectLabel,
  title,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("bg-sf-surface border-b border-sf-border px-6 py-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {objectIcon && (
            <div className="w-10 h-10 rounded-sf flex items-center justify-center bg-primary-500 text-white shrink-0 shadow-sm">
              {objectIcon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-sf-weak font-semibold uppercase tracking-wide mb-0.5">{objectLabel}</p>
            <h1 className="text-xl font-bold text-sf-text leading-tight truncate">{title}</h1>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 pt-0.5">{actions}</div>
        )}
      </div>
      {meta && <div className="mt-3 pl-[52px]">{meta}</div>}
    </div>
  );
}

interface ListHeaderProps {
  icon?: React.ReactNode;
  iconColor?: string;
  title: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}

export function ListHeader({ icon, iconColor = "bg-primary-500", title, count, actions, className }: ListHeaderProps) {
  return (
    <div className={cn("bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("w-9 h-9 rounded-sf flex items-center justify-center text-white shrink-0 shadow-sm", iconColor)}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-sf-text">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-sf-weak">({count.toLocaleString()})</span>
            )}
          </h1>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
