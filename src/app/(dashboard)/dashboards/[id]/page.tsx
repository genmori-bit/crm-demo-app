"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { WidgetWrapper, type DashWidget } from "@/components/dashboard/WidgetRenderer";
import { api } from "@/lib/api-client";

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

interface DashboardFilters {
  dateRange?: string;
  stage?: string;
  companyStatus?: string;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  thisMonth: "今月",
  thisQuarter: "今四半期",
  thisYear: "今年",
  last30: "過去30日",
};

const STAGE_OPTIONS = [
  { value: "", label: "全ステージ" },
  { value: "prospect", label: "見込み" },
  { value: "qualification", label: "検討" },
  { value: "proposal", label: "提案" },
  { value: "negotiation", label: "交渉" },
  { value: "closed_won", label: "受注" },
  { value: "closed_lost", label: "失注" },
];

const STATUS_OPTIONS = [
  { value: "", label: "全ステータス" },
  { value: "active", label: "アクティブ" },
  { value: "inactive", label: "非アクティブ" },
  { value: "prospect", label: "見込み" },
];

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [reordering, setReordering] = useState(false);

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

  useEffect(() => { load(); }, [load]);

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

  const handleMoveWidget = async (widgetId: string, direction: "up" | "down") => {
    if (!dashboard || reordering) return;
    const widgets = [...dashboard.widgets].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = widgets.findIndex((w) => w.id === widgetId);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= widgets.length) return;

    [widgets[idx], widgets[newIdx]] = [widgets[newIdx], widgets[idx]];
    const orderedIds = widgets.map((w) => w.id);

    setReordering(true);
    try {
      await api.post(`/api/dashboards/${id}/widgets/reorder`, { orderedIds });
      load();
    } catch {
      showToast("並び替えに失敗しました", "error");
    } finally {
      setReordering(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sf-weak">ダッシュボードが見つかりません</p>
        <Link href="/dashboards"><Button variant="secondary" size="sm">一覧へ戻る</Button></Link>
      </div>
    );
  }

  if (!dashboard) return <PageLoading />;

  const sortedWidgets = [...dashboard.widgets].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xs text-sf-weak mb-0.5">
              <Link href="/dashboards" className="hover:text-primary-500">ダッシュボード</Link>
              <span>/</span>
              <span>{dashboard.name}</span>
            </div>
            <h1 className="text-xl font-bold text-sf-text">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-xs text-sf-weak mt-0.5">{dashboard.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Link href={`/dashboards/${id}/builder`}>
                  <Button size="sm" variant="secondary">ウィジェット追加</Button>
                </Link>
                <Link href={`/dashboards/${id}/edit`}>
                  <Button size="sm" variant="secondary">設定編集</Button>
                </Link>
                <Button size="sm" onClick={() => setIsEditMode(false)}>完了</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={() => setIsEditMode(true)}>編集モード</Button>
                <Button size="sm" onClick={() => router.refresh()}>更新</Button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <select
            value={filters.dateRange ?? ""}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value || undefined })}
            className="border border-sf-border rounded-sf px-2 py-1 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">期間: すべて</option>
            {Object.entries(DATE_RANGE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={filters.stage ?? ""}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value || undefined })}
            className="border border-sf-border rounded-sf px-2 py-1 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.companyStatus ?? ""}
            onChange={(e) => setFilters({ ...filters, companyStatus: e.target.value || undefined })}
            className="border border-sf-border rounded-sf px-2 py-1 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(filters.dateRange || filters.stage || filters.companyStatus) && (
            <button
              onClick={() => setFilters({})}
              className="text-xs text-sf-weak hover:text-danger"
            >
              フィルターをリセット
            </button>
          )}
        </div>
      </div>

      {/* Widget grid */}
      <div className="p-6">
        {sortedWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-sf-weak">
            <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <p className="text-sm">ウィジェットがありません</p>
            <Link href={`/dashboards/${id}/builder`}>
              <Button size="sm">ウィジェットを追加</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 auto-rows-auto">
            {sortedWidgets.map((widget, idx) => (
              <WidgetWrapper
                key={widget.id}
                widget={widget}
                dashFilters={filters}
                isEditMode={isEditMode}
                onDelete={setDeleteWidgetId}
                onMoveUp={(wid) => handleMoveWidget(wid, "up")}
                onMoveDown={(wid) => handleMoveWidget(wid, "down")}
                onEdit={setEditingWidget}
                isFirst={idx === 0}
                isLast={idx === sortedWidgets.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit widget modal (inline edit for size/title) */}
      {editingWidget && (
        <EditWidgetModal
          widget={editingWidget}
          dashboardId={id}
          onClose={() => setEditingWidget(null)}
          onSaved={() => { setEditingWidget(null); load(); }}
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
  const [size, setSize] = useState(widget.size);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/dashboards/${dashboardId}/widgets/${widget.id}`, { title, size });
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
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sf-text mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sf-text mb-1">サイズ</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as DashWidget["size"])}
              className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="SMALL">小（1列）</option>
              <option value="MEDIUM">中（2列）</option>
              <option value="LARGE">大（2列×2行）</option>
              <option value="WIDE">横長（4列）</option>
              <option value="FULL">フル（4列×2行）</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>キャンセル</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
        </div>
      </div>
    </div>
  );
}
