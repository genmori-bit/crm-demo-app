"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { apps } from "@/lib/apps";

interface UserAccess {
  id: string;
  name: string | null;
  email: string;
  role: string;
  appAccess: { appId: string }[];
}

export default function AppAccessPage() {
  const showToast = useToast();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/settings/app-access").then((r) => r.json()).then((data) => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const toggle = async (userId: string, appId: string, hasAccess: boolean) => {
    await fetch("/api/settings/app-access", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, appId, action: hasAccess ? "revoke" : "grant" }),
    });
    load();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">アプリアクセス</h1>
        <p className="text-xs text-sf-weak mt-0.5">ユーザーごとにアプリへのアクセス権を管理します</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sf-border bg-sf-bg sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ユーザー</th>
                {apps.map((app) => (
                  <th key={app.id} className="px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider text-center whitespace-nowrap">
                    {app.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-sf-bg transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xs font-bold">
                        {(user.name ?? user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-sf-text">{user.name ?? user.email}</p>
                        <p className="text-2xs text-sf-weak">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  {apps.map((app) => {
                    const hasAccess = user.appAccess.some((a) => a.appId === app.id);
                    return (
                      <td key={app.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggle(user.id, app.id, hasAccess)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-colors",
                            hasAccess ? "bg-success border-success text-white" : "border-sf-border hover:border-primary-300"
                          )}
                          aria-label={hasAccess ? "アクセス取消" : "アクセス付与"}
                        >
                          {hasAccess && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={apps.length + 1} className="px-4 py-12 text-center text-xs text-sf-weak">ユーザーがいません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
