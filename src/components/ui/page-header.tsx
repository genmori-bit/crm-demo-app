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
            <div className="w-10 h-10 rounded-sf flex items-center justify-center bg-primary-500 text-white shrink-0">
              {objectIcon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-sf-weak font-medium mb-0.5">{objectLabel}</p>
            <h1 className="text-lg font-bold text-sf-text leading-tight truncate">{title}</h1>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {meta && <div className="mt-3">{meta}</div>}
    </div>
  );
}
