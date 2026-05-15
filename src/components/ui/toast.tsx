"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

const styles: Record<ToastType, string> = {
  success: "bg-white border-l-4 border-l-success border-success-border text-sf-text",
  error:   "bg-white border-l-4 border-l-danger border-danger-border text-sf-text",
  info:    "bg-white border-l-4 border-l-primary-500 border-info-border text-sf-text",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-success",
  error:   "text-danger",
  info:    "text-primary-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80"
        role="region"
        aria-label="通知"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-sf border shadow-dropdown text-sm animate-in",
              styles[toast.type]
            )}
          >
            <span className={iconStyles[toast.type]}>{icons[toast.type]}</span>
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-sf-weak hover:text-sf-text transition-colors focus:outline-none"
              aria-label="閉じる"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}
