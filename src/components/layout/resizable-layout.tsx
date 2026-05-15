"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getAppById } from "@/lib/apps";
import { useCurrentApp } from "@/hooks/useCurrentApp";
import { useSession } from "next-auth/react";

// ── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_MIN   = 160;
const SIDEBAR_MAX   = 320;
const SIDEBAR_DEFAULT = 220;
const COLLAPSED_W   = 52;
const COLLAPSE_SNAP = 120; // drag below this → collapse
const STORAGE_KEY   = "sidebar_width";

// ── Tooltip wrapper ──────────────────────────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50
                      whitespace-nowrap rounded-md bg-gray-900 text-white text-xs font-medium
                      px-2.5 py-1.5 shadow-lg opacity-0 group-hover/tip:opacity-100
                      transition-opacity duration-150 delay-200">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    </div>
  );
}

// ── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { currentAppId } = useCurrentApp();
  const { data: session } = useSession();
  const app = getAppById(currentAppId);

  const userName = session?.user?.name ?? "ユーザー";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* App label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <p className="text-2xs font-bold text-white/35 uppercase tracking-[0.12em] truncate">
            {app.label}
          </p>
        </div>
      )}
      {collapsed && <div className="pt-3" />}

      {/* Nav items */}
      <div className={cn("flex-1 py-1 space-y-0.5 overflow-y-auto", collapsed ? "px-1.5" : "px-2")}>
        {app.navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          if (collapsed) {
            return (
              <NavTooltip key={item.href} label={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 mx-auto rounded-[4px] transition-all duration-100 relative",
                    isActive
                      ? "text-white bg-white/[0.15]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-white rounded-r-full" />
                  )}
                  <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.7} d={item.icon} />
                  </svg>
                </Link>
              </NavTooltip>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-[4px] transition-all duration-100 relative group",
                isActive
                  ? "text-white bg-white/[0.12]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.07]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-white rounded-r-full" />
              )}
              <span className="shrink-0 w-[18px] flex items-center justify-center">
                <svg className={cn("h-[17px] w-[17px]", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-90")}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.7} d={item.icon} />
                </svg>
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User info */}
      <div className={cn("border-t border-white/[0.08] shrink-0", collapsed ? "px-1.5 py-2" : "px-3 py-3")}>
        {collapsed ? (
          <NavTooltip label={`${userName}\n${userEmail}`}>
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-primary-400/80 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                {userInitial}
              </div>
            </div>
          </NavTooltip>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-primary-400/80 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white/20">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/90 truncate">{userName}</p>
              <p className="text-2xs text-white/40 truncate">{userEmail}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ResizableLayout ──────────────────────────────────────────────────────────

export function ResizableLayout({ children }: { children: React.ReactNode }) {
  const [width, setWidth]       = useState(SIDEBAR_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging]  = useState(false);
  const startXRef   = useRef(0);
  const startWRef   = useRef(0);
  const frameRef    = useRef<number | null>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const v = JSON.parse(saved);
        if (v.collapsed) {
          setCollapsed(true);
        } else if (typeof v.width === "number") {
          setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, v.width)));
        }
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed ? { collapsed: true } : { width }));
    } catch {}
  }, [width, collapsed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current  = e.clientX;
    startWRef.current  = collapsed ? COLLAPSED_W : width;
    setDragging(true);
  }, [collapsed, width]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const dx  = e.clientX - startXRef.current;
        const raw = startWRef.current + dx;

        if (raw < COLLAPSE_SNAP) {
          setCollapsed(true);
        } else {
          setCollapsed(false);
          setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, raw)));
        }
      });
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [dragging]);

  const toggleCollapse = () => {
    if (collapsed) {
      setCollapsed(false);
      setWidth(SIDEBAR_DEFAULT);
    } else {
      setCollapsed(true);
    }
  };

  const sidebarW = collapsed ? COLLAPSED_W : width;

  return (
    <>
      {/* Sidebar */}
      <nav
        style={{ width: sidebarW }}
        className={cn(
          "fixed left-0 top-14 bottom-0 bg-sf-nav z-40 flex flex-col select-none",
          dragging ? "transition-none" : "transition-[width] duration-150 ease-out"
        )}
        aria-label="メインナビゲーション"
      >
        <SidebarContent collapsed={collapsed} />

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-1 group cursor-col-resize z-50",
            dragging && "bg-primary-500/40"
          )}
        >
          {/* Visible line */}
          <div className={cn(
            "absolute inset-y-0 right-0 w-px transition-colors",
            dragging ? "bg-primary-500" : "bg-white/10 group-hover:bg-white/25"
          )} />

          {/* Toggle button — appears on hover */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleCollapse}
            title={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -right-3",
              "w-6 h-6 rounded-full bg-sf-nav border border-white/15 shadow-md",
              "flex items-center justify-center",
              "text-white/50 hover:text-white hover:bg-sf-nav hover:border-white/30",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "transition-opacity duration-150",
              dragging && "opacity-0"
            )}
          >
            <svg
              className={cn("w-3 h-3 transition-transform duration-150", collapsed ? "rotate-180" : "")}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main
        style={{ marginLeft: sidebarW }}
        className={cn(
          "pt-14 min-h-screen",
          dragging ? "transition-none" : "transition-[margin-left] duration-150 ease-out"
        )}
      >
        {/* Drag overlay — prevents iframe/select interference while dragging */}
        {dragging && (
          <div className="fixed inset-0 z-50 cursor-col-resize" />
        )}
        {children}
      </main>
    </>
  );
}
