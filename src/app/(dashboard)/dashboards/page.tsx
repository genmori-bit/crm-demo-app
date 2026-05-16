"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

const VISIBILITY_BADGE: Record<string, string> = {
  PRIVATE: "bg-slate-100 text-slate-600",
  TEAM: "bg-info-light text-primary-700 border border-info-border",
  PUBLIC: "bg-success/10 text-success border border-success/20",
};

type ViewMode = "card" | "list";

// ─── Mini widget preview for card thumbnail ───────────────────────────────────

function MiniWidgetPreview({ count }: { count: number }) {
  const bars = Array.from({ length: Math.min(count, 6) });
  return (
    <div className="flex-1 flex items-end gap-1 px-3 pb-2">
      {bars.map((_, i) => {
        const h = [60, 80, 45, 90, 55, 70][i % 6];
        return (
          <div key={i} className="flex-1 rounded-sm bg-primary-200" style={{ height: `${h}%` }} />
        );
      })}
      {count === 0 && (
        <p className="text-2xs text-sf-weak/60 m-auto">ウィジェットなし</p>
      )}
    </div>
  );
}

// ─── Dashboard Card ───────────────────────────────────────────────────────────

function DashboardCard({
  dashboard,
  onDelete,
  onDuplicate,
  duplicating,
}: {
  dashboard: Dashboard;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  duplicating: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white border border-sf-border rounded-xl shadow-card hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
      {/* Preview thumbnail */}
      <Link href={`/dashboards/${dashboard.id}`} className="flex flex-col" style={{ height: 110 }}>
        <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
        <div className="flex-1 flex flex-col bg-sf-bg/50 relative overflow-hidden">
          <MiniWidgetPreview count={dashboard._count.widgets} />
          <div className="absolute top-2 right-2 bg-white/80 border border-sf-border rounded-full px-1.5 py-0.5 text-2xs text-sf-weak font-medium">
            {dashboard._count.widgets} ウィジェット
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="p-3.5 flex-1 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboards/${dashboard.id}`}
            className="text-sm font-semibold text-sf-text hover:text-primary-600 transition-colors leading-snug line-clamp-2 flex-1"
          >
            {dashboard.name}
          </Link>
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded text-sf-weak hover:text-sf-text hover:bg-sf-bg transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-7 w-36 bg-white border border-sf-border rounded-sf shadow-dropdown z-20 py-1"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <Link href={`/dashboards/${dashboard.id}/builder`} className="block px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg" onClick={() => setMenuOpen(false)}>
                  ビルダーで編集
                </Link>
                <button onClick={() => { setMenuOpen(false); onDuplicate(dashboard.id); }} disabled={duplicating} className="w-full text-left px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg disabled:opacity-50">
                  複製
                </button>
                <div className="border-t border-sf-border my-1" />
                <button onClick={() => { setMenuOpen(false); onDelete(dashboard.id); }} className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger-light">
                  削除
                </button>
              </div>
            )}
          </div>
        </div>

        {dashboard.description && (
          <p className="text-xs text-sf-weak line-clamp-1 leading-relaxed">{dashboard.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={cn("text-2xs font-medium px-1.5 py-0.5 rounded-full", VISIBILITY_BADGE[dashboard.visibility] ?? "bg-slate-100 text-slate-600")}>
            {VISIBILITY_LABELS[dashboard.visibility] ?? dashboard.visibility}
          </span>
          <span className="text-2xs text-sf-weak">{formatDateTime(dashboard.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard List Row ───────────────────────────────────────────────────────

function DashboardRow({
  dashboard,
  onDelete,
  onDuplicate,
  duplicating,
}: {
  dashboard: Dashboard;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  duplicating: boolean;
}) {
  return (
    <tr className="border-b border-sf-border/60 hover:bg-info-light/20 transition-colors group">
      <td className="px-4 py-2.5">
        <Link href={`/dashboards/${dashboard.id}`} className="text-sm font-semibold text-primary-600 hover:underline">
          {dashboard.name}
        </Link>
        {dashboard.description && (
          <p className="text-xs text-sf-weak truncate max-w-xs mt-0.5">{dashboard.description}</p>
        )}
      </td>
      <td className="px-4 py-2.5">
        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", VISIBILITY_BADGE[dashboard.visibility] ?? "bg-slate-100 text-slate-600")}>
          {VISIBILITY_LABELS[dashboard.visibility] ?? dashboard.visibility}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-sf-weak text-center tabular-nums">
        {dashboard._count.widgets}
      </td>
      <td className="px-4 py-2.5 text-xs text-sf-weak whitespace-nowrap">
        {dashboard.owner?.name ?? dashboard.owner?.email ?? "—"}
      </td>
      <td className="px-4 py-2.5 text-xs text-sf-weak whitespace-nowrap">
        {formatDateTime(dashboard.updatedAt)}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <Link href={`/dashboards/${dashboard.id}/builder`} className="text-xs text-sf-weak hover:text-primary-600 px-2 py-1 rounded hover:bg-primary-50 transition-colors">
            編集
          </Link>
          <button onClick={() => onDuplicate(dashboard.id)} disabled={duplicating} className="text-xs text-sf-weak hover:text-primary-600 px-2 py-1 rounded hover:bg-primary-50 transition-colors disabled:opacity-50">
            複製
          </button>
          <button onClick={() => onDelete(dashboard.id)} className="text-xs text-sf-weak hover:text-danger px-2 py-1 rounded hover:bg-danger-light transition-colors">
            削除
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [dashboards, setDashboards] = useState<Dashboard[] | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "shared">("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
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
    !search || d.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!dashboards) return <PageLoading />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">Analytics</p>
            <h1 className="text-xl font-bold text-sf-text">ダッシュボード</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/dashboards/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規ダッシュボード
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-sf-weak shrink-0 tabular-nums">
          {filtered?.length ?? 0} 件
        </span>
        <div className="flex border border-sf-border rounded-sf overflow-hidden text-xs shrink-0">
          {(["all", "mine", "shared"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1 font-medium transition-colors", filter === f ? "bg-primary-500 text-white" : "bg-white text-sf-weak hover:text-sf-text")}
            >
              {f === "all" ? "すべて" : f === "mine" ? "マイ" : "共有"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="search" placeholder="ダッシュボードを検索..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="ml-auto flex border border-sf-border rounded-sf overflow-hidden shrink-0">
          <button onClick={() => setViewMode("card")}
            className={cn("w-8 h-8 flex items-center justify-center transition-colors", viewMode === "card" ? "bg-primary-500 text-white" : "bg-white text-sf-weak hover:text-sf-text")}
            aria-label="カード表示"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button onClick={() => setViewMode("list")}
            className={cn("w-8 h-8 flex items-center justify-center transition-colors border-l border-sf-border", viewMode === "list" ? "bg-primary-500 text-white" : "bg-white text-sf-weak hover:text-sf-text")}
            aria-label="リスト表示"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {!filtered || filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-sf-weak">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <p className="text-sm">ダッシュボードが見つかりません</p>
            <Button onClick={() => router.push("/dashboards/new")}>新規作成</Button>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((d) => (
              <DashboardCard key={d.id} dashboard={d} onDelete={setDeleteId} onDuplicate={handleDuplicate} duplicating={duplicating === d.id} />
            ))}
          </div>
        ) : (
          <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">名前</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">公開範囲</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">ウィジェット</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">オーナー</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">更新日時</th>
                  <th className="px-4 py-2.5 w-32" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <DashboardRow key={d.id} dashboard={d} onDelete={setDeleteId} onDuplicate={handleDuplicate} duplicating={duplicating === d.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="ダッシュボードの削除"
        message="このダッシュボードを削除しますか？ウィジェットも全て削除されます。"
        confirmLabel="削除"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
