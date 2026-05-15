"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getAppById } from "@/lib/apps";
import { useCurrentApp } from "@/hooks/useCurrentApp";
import { useSession } from "next-auth/react";

export function SidebarNav() {
  const pathname = usePathname();
  const { currentAppId } = useCurrentApp();
  const { data: session } = useSession();
  const app = getAppById(currentAppId);

  const userName = session?.user?.name ?? "ユーザー";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <nav
      className="fixed left-0 top-14 bottom-0 w-[220px] bg-sf-nav flex flex-col z-40 overflow-y-auto"
      aria-label="メインナビゲーション"
    >
      {/* App label */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-2xs font-bold text-white/35 uppercase tracking-[0.12em]">{app.label}</p>
      </div>

      <div className="flex-1 px-2 py-1 space-y-0.5">
        {app.navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-[4px] transition-all duration-100 relative group",
                isActive
                  ? "text-white bg-white/[0.12]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.07]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-white rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <span className="shrink-0 w-[18px] flex items-center justify-center">
                <svg
                  className={cn("h-[17px] w-[17px]", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-90")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.7} d={item.icon} />
                </svg>
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User info at bottom */}
      <div className="px-3 py-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-primary-400/80 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white/20">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/90 truncate">{userName}</p>
            <p className="text-2xs text-white/40 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
