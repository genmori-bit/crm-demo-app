"use client";

import { useEffect, useState } from "react";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string | null;
  objectType: string;
  objectId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-success/10 text-success",
  UPDATE: "bg-primary-50 text-primary-600",
  DELETE: "bg-danger/10 text-danger",
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  Company: "企業",
  Contact: "担当者",
  Deal: "商談",
  Activity: "活動",
  Task: "タスク",
};

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [page, setPage] = useState(1);
  const [objectType, setObjectType] = useState("");
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    const params = new URLSearchParams({ page: String(page) });
    if (objectType) params.set("objectType", objectType);
    if (action) params.set("action", action);
    api.get<AuditResponse>(`/api/audit-logs?${params}`).then(setData);
  };

  useEffect(() => { load(); }, [page, objectType, action]);

  if (!data) return <PageLoading />;

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">監査ログ</h1>
      </div>

      <div className="p-6 space-y-4 max-w-5xl">
        <div className="flex items-center gap-3">
          <select
            value={objectType}
            onChange={(e) => { setObjectType(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-sf-border rounded-sf text-sm bg-white focus:outline-none"
          >
            <option value="">すべてのオブジェクト</option>
            {Object.entries(OBJECT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-sf-border rounded-sf text-sm bg-white focus:outline-none"
          >
            <option value="">すべての操作</option>
            <option value="CREATE">作成</option>
            <option value="UPDATE">更新</option>
            <option value="DELETE">削除</option>
          </select>
          <span className="text-sm text-sf-weak ml-auto">全{data.total}件</span>
        </div>

        <LightningCard>
          {data.logs.length === 0 ? (
            <LightningCardBody>
              <p className="text-sm text-sf-weak text-center py-4">ログがありません</p>
            </LightningCardBody>
          ) : (
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">日時</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">ユーザー</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">操作</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">対象</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">ID</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {data.logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-sf-bg/40">
                        <td className="px-4 py-3 text-sf-weak text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-3 text-sf-text text-xs">{log.user?.name ?? log.user?.email ?? "システム"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ACTION_STYLES[log.action] ?? "bg-sf-bg text-sf-weak")}>
                            {log.action === "CREATE" ? "作成" : log.action === "UPDATE" ? "更新" : log.action === "DELETE" ? "削除" : log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sf-text text-xs">{OBJECT_TYPE_LABELS[log.objectType] ?? log.objectType}</td>
                        <td className="px-4 py-3 text-sf-weak text-xs font-mono">{log.objectId.slice(0, 8)}…</td>
                        <td className="px-4 py-3 text-right">
                          {(log.before || log.after) && (
                            <button
                              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                              className="text-xs text-primary-500 hover:underline"
                            >
                              {expanded === log.id ? "閉じる" : "詳細"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-detail`} className="bg-sf-bg/30">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {log.before && (
                                <div>
                                  <p className="font-semibold text-sf-weak mb-1">変更前</p>
                                  <pre className="bg-sf-surface border border-sf-border rounded p-2 overflow-auto text-sf-text max-h-32">
                                    {JSON.stringify(log.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after && (
                                <div>
                                  <p className="font-semibold text-sf-weak mb-1">変更後</p>
                                  <pre className="bg-sf-surface border border-sf-border rounded p-2 overflow-auto text-sf-text max-h-32">
                                    {JSON.stringify(log.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-sf-border flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-xs text-primary-500 hover:underline disabled:text-sf-weak disabled:no-underline"
                  >
                    前へ
                  </button>
                  <span className="text-xs text-sf-weak">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-xs text-primary-500 hover:underline disabled:text-sf-weak disabled:no-underline"
                  >
                    次へ
                  </button>
                </div>
              )}
            </div>
          )}
        </LightningCard>
      </div>
    </div>
  );
}
