import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "neutral";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white border border-primary-600 hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1 shadow-sm",
  secondary:
    "bg-white text-sf-text border border-sf-border hover:bg-sf-bg hover:border-sf-border-strong active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1 shadow-sm",
  danger:
    "bg-danger text-white border border-danger hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1 shadow-sm",
  ghost:
    "bg-transparent text-sf-text border border-transparent hover:bg-sf-bg active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
  neutral:
    "bg-white text-sf-text border border-sf-border hover:bg-sf-bg shadow-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs h-7 gap-1",
  sm: "px-3 py-1.5 text-xs h-8 gap-1.5",
  md: "px-4 py-2 text-sm h-9 gap-1.5",
  lg: "px-5 py-2.5 text-sm h-10 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      className,
      children,
      disabled,
      iconOnly,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-sf font-medium transition-all duration-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          iconOnly && "px-0 w-8 h-8 gap-0",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-3.5 w-3.5 animate-spin shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
