import Link from "next/link";
import { cn } from "@/lib/utils";

interface CueCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  accent?: "primary" | "success" | "warning" | "danger" | "neutral";
  badge?: string;
  className?: string;
}

const accentMap = {
  primary: { border: "border-l-primary-500", icon: "bg-primary-50 text-primary-600", badge: "bg-primary-100 text-primary-700" },
  success: { border: "border-l-success", icon: "bg-green-50 text-green-600", badge: "bg-green-100 text-green-700" },
  warning: { border: "border-l-warning", icon: "bg-orange-50 text-orange-600", badge: "bg-orange-100 text-orange-700" },
  danger: { border: "border-l-danger", icon: "bg-red-50 text-red-600", badge: "bg-red-100 text-red-700" },
  neutral: { border: "border-l-sf-border", icon: "bg-sf-bg text-sf-weak", badge: "bg-sf-bg text-sf-weak" },
};

export function CueCard({ title, description, href, icon, accent = "primary", badge, className }: CueCardProps) {
  const colors = accentMap[accent];
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 bg-sf-surface border border-sf-border border-l-4 rounded-sf shadow-card px-4 py-3.5 hover:shadow-md hover:border-primary-200 transition-all",
        colors.border,
        className
      )}
    >
      {icon && (
        <div className={cn("w-8 h-8 rounded-sf flex items-center justify-center shrink-0 mt-0.5", colors.icon)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-sf-text group-hover:text-primary-600 transition-colors leading-snug">
            {title}
          </p>
          {badge && (
            <span className={cn("text-2xs font-semibold px-1.5 py-0.5 rounded shrink-0", colors.badge)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-2xs text-sf-weak mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-sf-weak group-hover:text-primary-500 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
