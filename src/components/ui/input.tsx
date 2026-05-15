import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  required?: boolean;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, required, helpText, className, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={cn(
            "block w-full rounded-sf border px-3 py-1.5 text-sm text-sf-text bg-white",
            "placeholder:text-sf-placeholder",
            "transition-[border-color,box-shadow] duration-100",
            "focus:outline-none",
            error
              ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(186,5,23,0.12)]"
              : "border-sf-border focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]",
            className
          )}
          {...props}
        />
        {helpText && !error && (
          <p id={`${id}-help`} className="text-xs text-sf-weak">{helpText}</p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-danger flex items-center gap-1">
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
Input.displayName = "Input";
