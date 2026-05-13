"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  defaultDateRange: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { name: string | null; email: string } | null;
  _count: { widgets: number };
}

const VISIBILITY_LABELS: Record<string, string> = {
  PRIVATE: "非公開",
  TEAM: "チーム",
  PUBLIC: "全体公開",
};

const VISIBILITY_COLORS: Record<string, string> = {
  PRIVATE: "bg-gray-100 text-gray-600",
  TEAM: "bg-blue-100 text-blue-700",
  PUBLIC: "bg-green-100 text-green-700",
};

export default function DashboardsPage() {
  const showToast = useToast();
  const [dashboards, setDashboards] = useState<Dashboard[] | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "shared">("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<Dashboard[]>(`/api/dashboards?filter=${filter}`).then(setDashboards);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/dashboards/${deleteId}`);
      showToast("ダッシュボードを削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicating(id);
    try {
      await api.post(`/api/dashboards/${id}/duplicate`, {});
      showToast("ダッシュボードを複製しました");
      load();
    } catch {
      showToast("複製に失敗しました", "error");
    } finally {
      setDuplicating(null);
    }
  };

  const filtered = dashboards?.filter((d) =>
    !search || d.name.includes(search) || (d.description ?? "").includes(search)
  );

  if (!dashboards) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">ダッシュボード</p>
          <h1 className="text-xl font-bold text-sf-text">ダッシュボード一覧</h1>
        </div>
        <Link href="/dashboards/new">
          <Button size="sm">新規ダッシュボード</Button>
        </Link>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-sf border border-sf-border overflow-hidden">
            {(["all", "mine", "shared"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f ? "bg-primary-500 text-white" : "bg-sf-surface text-sf-text hover:bg-sf-bg"
                }`}
              >
                {f === "all" ? "すべて" : f === "mine" ? "自分のダッシュボード" : "共有ダッシュボード"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="キーワード検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-sf-border rounded-sf px-3 py-1.5 text-xs bg-sf-surface text-sf-text focus:outline-none focus:ring-1 focus:ring-primary-500 w-56"
          />
        </div>

        {!filtered || filtered.length === 0 ? (
          <LightningCard>
            <LightningCardBody>
              <p className="text-center text-sf-weak py-8">
                {search ? "検索結果がありません" : "ダッシュボードがありません。新規作成してください。"}
              </p>
            </LightningCardBody>
          </LightningCard>
        ) : (
          <LightningCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/40">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">ダッシュボード名</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">説明</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">所有者</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">公開範囲</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-sf-weak">ウィジェット数</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">最終更新</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak">作成日</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-sf-bg/30">
                      <td className="px-4 py-3">
                        <Link href={`/dashboards/${d.id}`} className="text-primary-500 hover:underline font-medium">
                          {d.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sf-weak text-xs max-w-[200px] truncate">{d.description ?? "-"}</td>
                      <td className="px-4 py-3 text-sf-text text-xs">{d.owner?.name ?? d.owner?.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${VISIBILITY_COLORS[d.visibility] ?? ""}`}>
                          {VISIBILITY_LABELS[d.visibility] ?? d.visibility}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-sf-text">{d._count.widgets}</td>
                      <td className="px-4 py-3 text-xs text-sf-weak whitespace-nowrap">{formatDateTime(d.updatedAt)}</td>
                      <td className="px-4 py-3 text-xs text-sf-weak whitespace-nowrap">{formatDateTime(d.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/dashboards/${d.id}`} className="text-xs text-primary-500 hover:underline">表示</Link>
                          <Link href={`/dashboards/${d.id}/edit`} className="text-xs text-sf-weak hover:text-sf-text">編集</Link>
                          <button
                            onClick={() => handleDuplicate(d.id)}
                            disabled={duplicating === d.id}
                            className="text-xs text-sf-weak hover:text-sf-text disabled:opacity-50"
                          >
                            複製
                          </button>
                          <button
                            onClick={() => setDeleteId(d.id)}
                            className="text-xs text-danger hover:underline"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LightningCard>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="ダッシュボードを削除"
        message="このダッシュボードを削除しますか？この操作は元に戻せません。"
        confirmLabel="削除"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
