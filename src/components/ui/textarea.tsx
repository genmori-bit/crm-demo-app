import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, label, required, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-sf-weak uppercase tracking-wide"
          >
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={4}
          aria-invalid={!!error}
          className={cn(
            "block w-full rounded-sf border px-3 py-1.5 text-sm text-sf-text bg-white transition-colors focus:outline-none focus:ring-3 resize-none",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-sf-border focus:border-primary-500 focus:ring-primary-100",
            "placeholder:text-sf-placeholder",
            className
          )}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
