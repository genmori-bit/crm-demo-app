"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabDef {
  id: string;
  label: string;
  count?: number;
}

interface TabsCtx {
  active: string;
  setActive: (id: string) => void;
}

const Ctx = createContext<TabsCtx>({ active: "", setActive: () => {} });

export function RecordTabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");
  return (
    <Ctx.Provider value={{ active, setActive }}>
      <div className="bg-sf-surface border-b border-sf-border sticky top-14 z-30">
        <nav
          className="flex px-6 overflow-x-auto scrollbar-none"
          role="tablist"
          aria-label="レコードタブ"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200",
                active === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "text-2xs px-1.5 py-0.5 rounded-full font-semibold",
                    active === tab.id
                      ? "bg-primary-100 text-primary-700"
                      : "bg-sf-bg text-sf-weak"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      {children}
    </Ctx.Provider>
  );
}

export function TabPanel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { active } = useContext(Ctx);
  if (active !== id) return null;
  return <div role="tabpanel">{children}</div>;
}
