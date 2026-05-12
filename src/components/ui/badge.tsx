import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted" | "brand";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-sf-bg text-sf-text border border-sf-border",
  brand: "bg-info-light text-primary-700 border border-info-border",
  success: "bg-success-light text-success border border-success-border",
  warning: "bg-warning-light text-warning border border-warning-border",
  danger: "bg-danger-light text-danger border border-danger-border",
  info: "bg-info-light text-info border border-info-border",
  muted: "bg-sf-bg text-sf-weak border border-sf-border",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
