import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, label, required, className, id, children, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-sf-text"
          >
            {label}
            {required && <span className="text-danger ml-0.5" aria-label="必須">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={!!error}
            className={cn(
              "block w-full rounded-sf border px-3 py-1.5 text-sm text-sf-text bg-white appearance-none cursor-pointer pr-8",
              "transition-[border-color,box-shadow] duration-100",
              "focus:outline-none",
              error
                ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(186,5,23,0.12)]"
                : "border-sf-border focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sf-weak">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {error && (
          <p role="alert" className="text-xs text-danger flex items-center gap-1">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
