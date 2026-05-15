"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LoginEntry {
  id: string;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: "成功", color: "text-success" },
  failed: { label: "失敗", color: "text-danger" },
  locked: { label: "ロック", color: "text-warning" },
};

export default function LoginHistoryPage() {
  const [logs, setLogs] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/login-history?take=200").then((r) => r.json()).then((data) => {
      setLogs(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">ログイン履歴</h1>
        <p className="text-xs text-sf-weak mt-0.5">{logs.length}件</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sf-border bg-sf-bg sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">日時</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ユーザー</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">結果</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">IPアドレス</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ブラウザ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {logs.map((log) => {
                const st = STATUS_CONFIG[log.status] ?? { label: log.status, color: "text-sf-weak" };
                return (
                  <tr key={log.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-2.5 text-2xs text-sf-weak whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-sf-text">{log.user.name ?? log.user.email}</p>
                      <p className="text-2xs text-sf-weak">{log.user.email}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-xs font-semibold", st.color)}>{st.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sf-weak">{log.ipAddress ?? "—"}</td>
                    <td className="px-4 py-2.5 text-2xs text-sf-weak max-w-xs truncate">{log.userAgent ?? "—"}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-xs text-sf-weak">ログイン履歴がありません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
