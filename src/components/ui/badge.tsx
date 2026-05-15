import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted" | "brand" | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-sf-bg text-sf-text border border-sf-border",
  brand:   "bg-info-light text-primary-700 border border-info-border",
  success: "bg-success-light text-success border border-success-border",
  warning: "bg-warning-light text-warning border border-warning-border",
  danger:  "bg-danger-light text-danger border border-danger-border",
  info:    "bg-info-light text-info border border-info-border",
  muted:   "bg-sf-bg text-sf-weak border border-sf-border",
  purple:  "bg-purple-50 text-purple-700 border border-purple-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-sf-weak",
  brand:   "bg-primary-500",
  success: "bg-success",
  warning: "bg-warning",
  danger:  "bg-danger",
  info:    "bg-info",
  muted:   "bg-sf-placeholder",
  purple:  "bg-purple-500",
};

export function Badge({ children, variant = "default", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap leading-5",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
