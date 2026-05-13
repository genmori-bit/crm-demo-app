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
  const userInitial = userName.charAt(0);

  return (
    <nav
      className="fixed left-0 top-14 bottom-0 w-[220px] bg-sf-nav flex flex-col z-40 overflow-y-auto"
      aria-label="メインナビゲーション"
    >
      {/* App name label */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-2xs font-semibold text-white/40 uppercase tracking-widest">{app.label}</p>
      </div>

      <div className="flex-1 py-1">
        {app.navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "text-white bg-primary-700/60"
                  : "text-white/70 hover:text-white hover:bg-white/[0.08]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-white rounded-r" aria-hidden="true" />
              )}
              <span className="shrink-0 w-5 flex items-center justify-center">
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                </svg>
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User info at bottom */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-2xs text-white/50 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
