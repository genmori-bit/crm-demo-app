"use client";

import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLauncher } from "@/components/layout/app-launcher";
import { useCurrentApp } from "@/hooks/useCurrentApp";
import { getAppById } from "@/lib/apps";

export function AppHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentAppId, setCurrentApp } = useCurrentApp();
  const currentApp = getAppById(currentAppId);

  const userName = session?.user?.name ?? "ユーザー";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sf-nav flex items-center px-4 gap-3">
      {/* App launcher + brand */}
      <div className="flex items-center gap-3 shrink-0">
        <AppLauncher currentAppId={currentAppId} onSelect={setCurrentApp} />
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide whitespace-nowrap">
            Simple CRM
          </span>
          <span className="text-white/40 text-xs">|</span>
          <span className="text-white/80 text-xs font-medium whitespace-nowrap">
            {currentApp.label}
          </span>
        </div>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            placeholder="顧客、担当者、商談を検索... (Enter)"
            className="w-full h-9 bg-primary-700/50 border border-primary-600/50 rounded-sf pl-9 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:bg-white focus:text-sf-text focus:placeholder:text-sf-placeholder focus:border-transparent focus:ring-2 focus:ring-white/40 transition-all"
            aria-label="グローバル検索"
          />
        </div>
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="w-9 h-9 rounded flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="通知"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button
          className="w-9 h-9 rounded flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          onClick={() => router.push("/settings")}
          aria-label="設定"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* User avatar */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-bold hover:bg-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="ユーザーメニュー"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            {userInitial}
          </button>
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-sf border border-sf-border shadow-dropdown py-1 z-50"
              role="menu"
            >
              <div className="px-4 py-2 border-b border-sf-border">
                <p className="text-xs font-medium text-sf-text">{userName}</p>
                <p className="text-xs text-sf-weak">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-sf-text hover:bg-sf-bg transition-colors"
                role="menuitem"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
