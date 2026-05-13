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

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
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
    setSearch("");
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="アプリケーションランチャー"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="4" height="4" rx="1" />
          <rect x="10" y="3" width="4" height="4" rx="1" />
          <rect x="17" y="3" width="4" height="4" rx="1" />
          <rect x="3" y="10" width="4" height="4" rx="1" />
          <rect x="10" y="10" width="4" height="4" rx="1" />
          <rect x="17" y="10" width="4" height="4" rx="1" />
          <rect x="3" y="17" width="4" height="4" rx="1" />
          <rect x="10" y="17" width="4" height="4" rx="1" />
          <rect x="17" y="17" width="4" height="4" rx="1" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="アプリケーションランチャー"
          className="absolute left-0 top-full mt-1 w-80 bg-white border border-sf-border rounded-sf shadow-xl z-[100]"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-sf-border">
            <h2 className="text-sm font-bold text-sf-text">アプリケーションランチャー</h2>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-sf-border">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="アプリを検索..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-sf-border rounded-sf focus:outline-none focus:ring-1 focus:ring-primary-500 bg-sf-bg text-sf-text placeholder:text-sf-weak"
              />
            </div>
          </div>

          {/* App grid */}
          <div className="p-3 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {filtered.map((app) => {
              const isActive = app.id === currentAppId;
              return (
                <button
                  key={app.id}
                  onClick={() => handleSelect(app.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-sf border text-center transition-all hover:shadow-sm",
                    isActive
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-sf-border hover:border-primary-300 hover:bg-sf-bg text-sf-text"
                  )}
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{app.label}</p>
                    {isActive && (
                      <span className="inline-flex items-center gap-0.5 text-2xs text-primary-600 mt-0.5">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        選択中
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-2 text-center text-xs text-sf-weak py-4">見つかりません</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
