"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { WidgetWrapper, SIZE_COLS, type DashWidget, type DashboardFilters } from "@/components/dashboard/WidgetRenderer";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  defaultDateRange: string | null;
  ownerId: string | null;
  owner: { name: string | null; email: string } | null;
  widgets: DashWidget[];
}

// ─── Date range / filter labels ───────────────────────────────────────────────

const DATE_RANGE_OPTIONS = [
  { value: "", label: "期間: すべて" },
  { value: "thisMonth", label: "今月" },
  { value: "thisQuarter", label: "今四半期" },
  { value: "thisYear", label: "今年" },
  { value: "last30", label: "過去30日" },
];

const STAGE_OPTIONS = [
  { value: "", label: "全ステージ" },
  { value: "qualification", label: "初期確認" },
  { value: "proposal", label: "提案" },
  { value: "negotiation", label: "交渉" },
  { value: "final_review", label: "最終確認" },
  { value: "won", label: "受注" },
];

// ─── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
}) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={filters.dateRange ?? ""}
        onChange={(e) => onChange({ ...filters, dateRange: e.target.value || undefined })}
        className="h-7 border border-sf-border rounded-sf px-2 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {DATE_RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={filters.stage ?? ""}
        onChange={(e) => onChange({ ...filters, stage: e.target.value || undefined })}
        className="h-7 border border-sf-border rounded-sf px-2 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {STAGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {activeCount > 0 && (
        <button
          onClick={() => onChange({})}
          className="flex items-center gap-1 h-7 px-2 text-xs text-danger border border-danger-border bg-danger-light rounded-sf hover:bg-danger hover:text-white transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          リセット ({activeCount})
        </button>
      )}
    </div>
  );
}

// ─── Widget grid ──────────────────────────────────────────────────────────────

/**
 * Lay out widgets using their saved position if available, otherwise fall back
 * to a simple CSS 12-column grid ordered by sortOrder.
 */
function WidgetGrid({
  widgets,
  filters,
  isEditMode,
  onDelete,
  onEdit,
}: {
  widgets: DashWidget[];
  filters: DashboardFilters;
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onEdit: (w: DashWidget) => void;
}) {
  // Sort: by position.y then position.x if available, else by sortOrder
  const sorted = [...widgets].sort((a, b) => {
    const ap = a.position as Record<string, number> | undefined;
    const bp = b.position as Record<string, number> | undefined;
    if (ap?.y !== undefined && bp?.y !== undefined) {
      if (ap.y !== bp.y) return ap.y - bp.y;
      return (ap.x ?? 0) - (bp.x ?? 0);
    }
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-auto">
      {sorted.map((widget) => {
        const pos = widget.position as Record<string, number> | undefined;
        const colSpan = pos?.w ? `col-span-${pos.w}` : SIZE_COLS[widget.size];
        const rowSpan = pos?.h ? `row-span-${pos.h}` : undefined;
        const minH = pos?.h ? `min-h-[${pos.h * 80}px]` : undefined;

        return (
          <div
            key={widget.id}
            className={cn(colSpan, rowSpan)}
            style={pos?.h ? { minHeight: `${pos.h * 80}px` } : undefined}
          >
            <WidgetWrapper
              widget={widget}
              dashFilters={filters}
              isEditMode={isEditMode}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Edit Widget Modal ────────────────────────────────────────────────────────

function EditWidgetModal({
  widget,
  dashboardId,
  onClose,
  onSaved,
}: {
  widget: DashWidget;
  dashboardId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(widget.title);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/dashboards/${dashboardId}/widgets/${widget.id}`, { title });
      showToast("ウィジェットを更新しました");
      onSaved();
    } catch {
      showToast("更新に失敗しました", "error");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-sf shadow-xl w-80 p-5">
        <h2 className="text-sm font-semibold text-sf-text mb-4">ウィジェット編集</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-sf-text mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page (View Mode) ─────────────────────────────────────────

export default function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteWidgetId, setDeleteWidgetId] = useState<string | null>(null);
  const [deletingWidget, setDeletingWidget] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashWidget | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await api.get<Dashboard>(`/api/dashboards/${id}`);
      setDashboard(d);
      if (d.defaultDateRange && !filters.dateRange) {
        setFilters((f) => ({ ...f, dateRange: d.defaultDateRange ?? undefined }));
      }
    } catch {
      setNotFound(true);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteWidget = async () => {
    if (!deleteWidgetId) return;
    setDeletingWidget(true);
    try {
      await api.delete(`/api/dashboards/${id}/widgets/${deleteWidgetId}`);
      showToast("ウィジェットを削除しました");
      setDeleteWidgetId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeletingWidget(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sf-weak">ダッシュボードが見つかりません</p>
        <Link href="/dashboards">
          <Button variant="secondary" size="sm">一覧へ戻る</Button>
        </Link>
      </div>
    );
  }

  if (!dashboard) return <PageLoading />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xs text-sf-weak mb-0.5">
              <Link href="/dashboards" className="hover:text-primary-500">
                ダッシュボード
              </Link>
              <span>/</span>
              <span className="truncate">{dashboard.name}</span>
            </div>
            <h1 className="text-lg font-bold text-sf-text truncate">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-xs text-sf-weak mt-0.5">{dashboard.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {isEditMode ? (
              <>
                <Link href={`/dashboards/${id}/builder`}>
                  <Button size="sm" variant="secondary">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ウィジェット追加
                  </Button>
                </Link>
                <Link href={`/dashboards/${id}/edit`}>
                  <Button size="sm" variant="secondary">設定</Button>
                </Link>
                <Button size="sm" onClick={() => setIsEditMode(false)}>完了</Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRefreshKey((k) => k + 1);
                    router.refresh();
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  更新
                </Button>
                <Link href={`/dashboards/${id}/builder`}>
                  <Button size="sm" variant="secondary">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    編集
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-2">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* ── Widget grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-auto">
        {dashboard.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-sf-weak">
            <svg
              className="w-14 h-14 opacity-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <p className="text-sm font-medium">ウィジェットがありません</p>
            <p className="text-xs">ビルダーからウィジェットを追加してください</p>
            <Link href={`/dashboards/${id}/builder`}>
              <Button size="sm">ビルダーを開く</Button>
            </Link>
          </div>
        ) : (
          <WidgetGrid
            key={refreshKey}
            widgets={dashboard.widgets}
            filters={filters}
            isEditMode={isEditMode}
            onDelete={setDeleteWidgetId}
            onEdit={setEditingWidget}
          />
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {editingWidget && (
        <EditWidgetModal
          widget={editingWidget}
          dashboardId={id}
          onClose={() => setEditingWidget(null)}
          onSaved={() => {
            setEditingWidget(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteWidgetId}
        title="ウィジェットを削除"
        message="このウィジェットを削除しますか？"
        confirmLabel="削除"
        onConfirm={handleDeleteWidget}
        onClose={() => setDeleteWidgetId(null)}
        loading={deletingWidget}
      />
    </div>
  );
}
