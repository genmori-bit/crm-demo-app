"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apps, type AppId } from "@/lib/apps";
import { cn } from "@/lib/utils";

interface AppLauncherProps {
  currentAppId: AppId;
  onSelect: (id: AppId) => void;
}

export function AppLauncher({ currentAppId, onSelect }: AppLauncherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(""); return; }
    setTimeout(() => searchRef.current?.focus(), 50);

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
    }
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const filtered = apps.filter(
    (a) => !search || a.label.includes(search) || a.description.includes(search)
  );

  function handleSelect(id: AppId) {
    const app = apps.find((a) => a.id === id);
    if (!app) return;
    onSelect(id);
    router.push(app.defaultPath);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-9 h-9 rounded flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/40",
          open ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
        aria-label="アプリケーションランチャー"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* 9-dot grid icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="16" cy="4" r="1.5" />
          <circle cx="4" cy="10" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="4" cy="16" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
          <circle cx="16" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="アプリケーションランチャー"
          aria-modal="true"
          className="absolute left-0 top-[calc(100%+4px)] w-[340px] bg-sf-surface border border-sf-border rounded-sf shadow-dropdown z-[200] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-sf-border">
            <p className="text-xs font-bold text-sf-weak uppercase tracking-wider">アプリケーションランチャー</p>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-sf-border bg-sf-bg">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="アプリを検索..."
                className="w-full h-8 pl-8 pr-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white text-sf-text placeholder:text-sf-placeholder transition-colors"
              />
            </div>
          </div>

          {/* App grid */}
          <div className="p-3 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((app) => {
              const isActive = app.id === currentAppId;
              return (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app.id)}
                  className={cn(
                    "group flex flex-col items-center gap-2 p-3 rounded-sf border text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-200",
                    isActive
                      ? "border-primary-400 bg-primary-50 shadow-sm"
                      : "border-sf-border hover:border-primary-200 hover:bg-sf-bg hover:shadow-sm"
                  )}
                >
                  {/* Icon box */}
                  <div className={cn(
                    "w-10 h-10 rounded-sf flex items-center justify-center text-white shadow-sm relative",
                    app.iconColor
                  )}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={app.iconPath} />
                    </svg>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="min-w-0 w-full">
                    <p className={cn(
                      "text-xs font-semibold leading-tight truncate",
                      isActive ? "text-primary-700" : "text-sf-text group-hover:text-primary-600"
                    )}>
                      {app.label}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-3 text-center text-xs text-sf-weak py-6">
                「{search}」に一致するアプリが見つかりません
              </p>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-sf-border bg-sf-bg">
            <p className="text-2xs text-sf-weak text-center">
              Esc キーで閉じる
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
