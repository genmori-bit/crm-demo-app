"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { type AppId, inferAppFromPath } from "@/lib/apps";

const STORAGE_KEY = "crm_current_app";

export function useCurrentApp() {
  const pathname = usePathname();
  const [currentAppId, setCurrentAppIdState] = useState<AppId>("sales");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as AppId | null;
    const inferred = inferAppFromPath(pathname);
    // On first load, infer from URL; thereafter use stored value unless URL indicates a switch
    const initial = saved ?? inferred;
    setCurrentAppIdState(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When pathname changes, update app if it clearly belongs to another app
  useEffect(() => {
    if (!mounted) return;
    const inferred = inferAppFromPath(pathname);
    setCurrentAppIdState(inferred);
    localStorage.setItem(STORAGE_KEY, inferred);
  }, [pathname, mounted]);

  const setCurrentApp = useCallback((id: AppId) => {
    setCurrentAppIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return { currentAppId, setCurrentApp };
}
