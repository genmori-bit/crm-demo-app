"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useEffect, useState, useCallback, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GridLayout, type LayoutItem, type Layout as RGLayout } from "react-grid-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { WidgetWrapper, type DashWidget } from "@/components/dashboard/WidgetRenderer";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  name: string;
  objectType: string;
  description: string | null;
  isPublic: boolean;
  createdBy: { name: string | null; email: string };
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  widgets: DashWidget[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 12;
const ROW_HEIGHT = 80;

const OBJECT_TYPE_LABELS: Record<string, string> = {
  deal: "商談",
  company: "企業",
  contact: "担当者",
  activity: "活動",
  task: "タスク",
};

const WIDGET_CATALOG = [
  { value: "KPI", label: "KPI", desc: "単一数値を大きく表示", icon: "📊", defaultW: 3, defaultH: 2 },
  { value: "BAR", label: "棒グラフ", desc: "カテゴリ別の比較", icon: "📈", defaultW: 6, defaultH: 4 },
  { value: "LINE", label: "折れ線グラフ", desc: "時系列推移", icon: "📉", defaultW: 6, defaultH: 4 },
  { value: "DONUT", label: "ドーナツ", desc: "構成比", icon: "🍩", defaultW: 4, defaultH: 4 },
  { value: "FUNNEL", label: "ファネル", desc: "段階別変換率", icon: "🔻", defaultW: 6, defaultH: 4 },
  { value: "TABLE", label: "テーブル", desc: "一覧データ", icon: "📋", defaultW: 6, defaultH: 4 },
  { value: "RANKING", label: "ランキング", desc: "上位ランキング表示", icon: "🏆", defaultW: 4, defaultH: 4 },
  { value: "RISK_LIST", label: "リスク一覧", desc: "要対応案件の一覧", icon: "⚠️", defaultW: 6, defaultH: 4 },
];

const SIZE_PRESETS = [
  { label: "小（KPI）", w: 3, h: 2 },
  { label: "中", w: 4, h: 3 },
  { label: "大", w: 6, h: 4 },
  { label: "横長", w: 8, h: 3 },
  { label: "全幅", w: 12, h: 4 },
];

// ─── Layout helpers ────────────────────────────────────────────────────────────

function widgetToGridItem(w: DashWidget, index: number): LayoutItem {
  const pos = w.position as Record<string, number>;
  if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
    return { i: w.id, x: pos.x, y: pos.y, w: pos.w ?? 4, h: pos.h ?? 3, minW: 2, minH: 2 };
  }
  // Auto-layout: fill row by row
  const col = index % 2;
  const row = Math.floor(index / 2);
  return { i: w.id, x: col * 6, y: row * 4, w: 6, h: 4, minW: 2, minH: 2 };
}

function findFreePosition(layout: LayoutItem[], w: number, h: number): { x: number; y: number } {
  const maxY = layout.reduce((m, item) => Math.max(m, item.y + item.h), 0);
  // Try each row from top
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= COLS - w; x++) {
      const fits = !layout.some(
        (item) =>
          x < item.x + item.w &&
          x + w > item.x &&
          y < item.y + item.h &&
          y + h > item.y,
      );
      if (fits) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

// ─── Panel: Left ──────────────────────────────────────────────────────────────

type LeftTab = "reports" | "components";

function LeftPanel({
  reports,
  onAddFromReport,
  onAddWidget,
}: {
  reports: Report[] | null;
  onAddFromReport: (report: Report, type: string) => void;
  onAddWidget: (type: string, defaultW: number, defaultH: number) => void;
}) {
  const [tab, setTab] = useState<LeftTab>("reports");
  const [search, setSearch] = useState("");
  const [objectFilter, setObjectFilter] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const filtered = reports?.filter((r) => {
    const matchObj = !objectFilter || r.objectType === objectFilter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    return matchObj && matchSearch;
  });

  return (
    <aside className="w-64 border-r border-sf-border bg-sf-surface flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-sf-border shrink-0">
        {(["reports", "components"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition-colors",
              tab === t
                ? "text-primary-600 border-b-2 border-primary-500"
                : "text-sf-weak hover:text-sf-text",
            )}
          >
            {t === "reports" ? "レポート" : "コンポーネント"}
          </button>
        ))}
      </div>

      {/* Reports tab */}
      {tab === "reports" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2 space-y-2 shrink-0">
            <input
              type="text"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-7 px-2.5 text-xs border border-sf-border rounded-sf focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
            />
            <select
              value={objectFilter}
              onChange={(e) => setObjectFilter(e.target.value)}
              className="w-full h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none bg-white text-sf-text"
            >
              <option value="">全オブジェクト</option>
              {Object.entries(OBJECT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!filtered ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-sf-weak text-center py-6">レポートなし</p>
            ) : (
              <div className="divide-y divide-sf-border/50">
                {filtered.map((report) => (
                  <div key={report.id} className="group">
                    <button
                      onClick={() =>
                        setExpandedReport(expandedReport === report.id ? null : report.id)
                      }
                      className="w-full text-left px-3 py-2.5 hover:bg-sf-bg/50 flex items-start gap-2"
                    >
                      <span className="text-xs text-sf-weak mt-0.5 shrink-0">
                        {OBJECT_TYPE_LABELS[report.objectType] ?? report.objectType}
                      </span>
                      <span className="text-xs font-medium text-sf-text group-hover:text-primary-600 flex-1 leading-tight">
                        {report.name}
                      </span>
                      <svg
                        className={cn(
                          "w-3 h-3 text-sf-weak shrink-0 mt-0.5 transition-transform",
                          expandedReport === report.id && "rotate-90",
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {expandedReport === report.id && (
                      <div className="bg-sf-bg/30 px-3 py-2 border-t border-sf-border/30">
                        <p className="text-2xs text-sf-weak mb-2">ウィジェットタイプを選択:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {WIDGET_CATALOG.map((wt) => (
                            <button
                              key={wt.value}
                              onClick={() => {
                                onAddFromReport(report, wt.value);
                                setExpandedReport(null);
                              }}
                              className="text-left px-2 py-1.5 bg-white border border-sf-border rounded hover:border-primary-400 hover:bg-info-light/30 transition-colors"
                            >
                              <span className="text-xs">{wt.icon} {wt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Components tab */}
      {tab === "components" && (
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-2xs text-sf-weak mb-2 px-1">ウィジェットを追加</p>
          <div className="space-y-1">
            {WIDGET_CATALOG.map((wt) => (
              <button
                key={wt.value}
                onClick={() => onAddWidget(wt.value, wt.defaultW, wt.defaultH)}
                className="w-full text-left px-3 py-2.5 rounded hover:bg-info-light/30 border border-transparent hover:border-info-border transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{wt.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-sf-text">{wt.label}</p>
                    <p className="text-2xs text-sf-weak">{wt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Panel: Right (widget settings) ──────────────────────────────────────────

function RightPanel({
  widget,
  onUpdate,
  onClose,
}: {
  widget: DashWidget | null;
  onUpdate: (id: string, changes: Partial<DashWidget>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(widget?.title ?? "");
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (widget && widget.id !== prevIdRef.current) {
      setTitle(widget.title);
      prevIdRef.current = widget.id;
    }
  }, [widget]);

  if (!widget) {
    return (
      <aside className="w-56 border-l border-sf-border bg-sf-surface shrink-0 flex flex-col items-center justify-center text-center p-4">
        <svg className="w-10 h-10 text-sf-weak/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        <p className="text-xs text-sf-weak">ウィジェットを選択してください</p>
      </aside>
    );
  }

  return (
    <aside className="w-56 border-l border-sf-border bg-sf-surface shrink-0 flex flex-col">
      <div className="px-3 py-2.5 border-b border-sf-border flex items-center justify-between">
        <span className="text-xs font-semibold text-sf-text">ウィジェット設定</span>
        <button onClick={onClose} className="text-sf-weak hover:text-sf-text">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-2xs font-semibold text-sf-weak uppercase tracking-wide mb-1">
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onUpdate(widget.id, { title })}
            className="w-full h-7 px-2.5 text-xs border border-sf-border rounded-sf focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-sf-text"
          />
        </div>

        {/* Size presets */}
        <div>
          <label className="block text-2xs font-semibold text-sf-weak uppercase tracking-wide mb-1.5">
            サイズプリセット
          </label>
          <div className="space-y-1">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  onUpdate(widget.id, {
                    position: { ...((widget.position as Record<string, number>) ?? {}), w: p.w, h: p.h },
                  });
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-sf-text hover:bg-info-light/30 border border-sf-border rounded hover:border-info-border transition-colors"
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-sf-weak ml-1">({p.w}×{p.h})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-2xs font-semibold text-sf-weak uppercase tracking-wide mb-1">
            ウィジェットタイプ
          </label>
          <p className="text-xs text-sf-text">
            {WIDGET_CATALOG.find((w) => w.value === widget.widgetType)?.icon}{" "}
            {WIDGET_CATALOG.find((w) => w.value === widget.widgetType)?.label ?? widget.widgetType}
          </p>
        </div>

        {/* Report */}
        <div>
          <label className="block text-2xs font-semibold text-sf-weak uppercase tracking-wide mb-1">
            レポート
          </label>
          <Link
            href={`/reports/${widget.report.id}`}
            className="text-xs text-primary-600 hover:underline"
            target="_blank"
          >
            {widget.report.name} →
          </Link>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Builder Page ────────────────────────────────────────────────────────

export default function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [widgets, setWidgets] = useState<DashWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Measure container width for react-grid-layout
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width || 900);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const loadData = useCallback(async () => {
    const [dash, reps] = await Promise.all([
      api.get<Dashboard>(`/api/dashboards/${id}`),
      api.get<Report[]>("/api/reports"),
    ]);
    setDashboard(dash);
    setReports(reps);
    const sortedWidgets = [...(dash.widgets ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    setWidgets(sortedWidgets);
    setLayout(sortedWidgets.map((w, i) => widgetToGridItem(w, i)));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Layout change handler ────────────────────────────────────────────────

  const handleLayoutChange = useCallback((newLayout: RGLayout) => {
    // RGLayout is readonly LayoutItem[], spread to mutable array
    setLayout([...newLayout]);
    setIsDirty(true);
  }, []);

  // ── Add widget from report ───────────────────────────────────────────────

  const handleAddFromReport = useCallback(
    async (report: Report, type: string) => {
      if (adding) return;
      const catalogItem = WIDGET_CATALOG.find((c) => c.value === type);
      const w = catalogItem?.defaultW ?? 6;
      const h = catalogItem?.defaultH ?? 4;
      const { x, y } = findFreePosition(layout, w, h);

      setAdding(true);
      try {
        const widget = await api.post<DashWidget>(`/api/dashboards/${id}/widgets`, {
          reportId: report.id,
          title: report.name,
          widgetType: type,
          size: "MEDIUM",
          config: {},
          position: { x, y, w, h },
        });
        const newWidget = { ...widget, dashboardId: id };
        setWidgets((prev) => [...prev, newWidget]);
        setLayout((prev) => [
          ...prev,
          { i: widget.id, x, y, w, h, minW: 2, minH: 2 },
        ]);
        setSelectedWidgetId(widget.id);
        setIsDirty(true);
        showToast("ウィジェットを追加しました");
      } catch {
        showToast("追加に失敗しました", "error");
      } finally {
        setAdding(false);
      }
    },
    [adding, id, layout, showToast],
  );

  // ── Add blank widget (from components tab) ───────────────────────────────

  const handleAddWidget = useCallback(
    async (type: string, defaultW: number, defaultH: number) => {
      // Need at least one report
      if (!reports || reports.length === 0) {
        showToast("先にレポートを作成してください", "error");
        return;
      }
      await handleAddFromReport(reports[0], type);
    },
    [reports, handleAddFromReport, showToast],
  );

  // ── Delete widget ────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (widgetId: string) => {
      try {
        await api.delete(`/api/dashboards/${id}/widgets/${widgetId}`);
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        setLayout((prev) => prev.filter((l) => l.i !== widgetId));
        if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
        setIsDirty(false); // deletion is already saved
        showToast("ウィジェットを削除しました");
      } catch {
        showToast("削除に失敗しました", "error");
      }
      setDeleteConfirmId(null);
    },
    [id, selectedWidgetId, showToast],
  );

  // ── Widget local update (title, position changes via right panel) ────────

  const handleWidgetUpdate = useCallback(
    (widgetId: string, changes: Partial<DashWidget>) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === widgetId ? { ...w, ...changes } : w)),
      );
      if (changes.position) {
        const pos = changes.position as Record<string, number>;
        setLayout((prev) =>
          prev.map((l) =>
            l.i === widgetId
              ? { ...l, w: pos.w ?? l.w, h: pos.h ?? l.h }
              : l,
          ),
        );
      }
      setIsDirty(true);
    },
    [],
  );

  // ── Save layout ──────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!dashboard) return;
    setSaving(true);
    try {
      // 1. Save positions
      const items = layout.map((l) => ({
        widgetId: l.i,
        position: { x: l.x, y: l.y, w: l.w, h: l.h },
      }));
      await api.post(`/api/dashboards/${id}/layout`, { items });

      // 2. Save title changes
      await Promise.all(
        widgets.map((w) =>
          api.patch(`/api/dashboards/${id}/widgets/${w.id}`, { title: w.title }),
        ),
      );

      setIsDirty(false);
      showToast("レイアウトを保存しました");
    } catch {
      showToast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }, [dashboard, id, layout, widgets, showToast]);

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId) ?? null;

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-sf-bg overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2 flex items-center gap-3 shrink-0">
        <Link href={`/dashboards/${id}`} className="text-sf-weak hover:text-primary-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-sm font-bold text-sf-text truncate">{dashboard.name}</h1>
          <span className="text-2xs bg-primary-100 text-primary-700 border border-primary-200 px-1.5 py-0.5 rounded-full font-medium shrink-0">
            編集中
          </span>
          {isDirty && (
            <span className="text-2xs text-warning font-medium shrink-0">● 未保存</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {adding && (
            <span className="text-xs text-sf-weak animate-pulse">追加中...</span>
          )}
          <Link href={`/dashboards/${id}`}>
            <Button variant="secondary" size="sm">
              キャンセル
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* ── Main area: left panel + canvas + right panel ─────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: report/component selector */}
        <LeftPanel
          reports={reports}
          onAddFromReport={handleAddFromReport}
          onAddWidget={handleAddWidget}
        />

        {/* Center: grid canvas */}
        <main className="flex-1 overflow-auto bg-sf-bg p-4" ref={containerRef}>
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-sf-weak">
              <div className="w-16 h-16 border-2 border-dashed border-sf-border rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm">レポートを追加してダッシュボードを作成</p>
              <p className="text-xs">左パネルから「レポート」または「コンポーネント」を選択してください</p>
            </div>
          ) : (
            <div className="rgl-canvas rounded-xl overflow-visible">
              <GridLayout
                layout={layout}
                width={containerWidth - 32}
                onLayoutChange={handleLayoutChange}
                onDragStart={() => setIsDirty(true)}
                onResizeStart={() => setIsDirty(true)}
                gridConfig={{
                  cols: COLS,
                  rowHeight: ROW_HEIGHT,
                  margin: [12, 12] as [number, number],
                  containerPadding: [4, 4] as [number, number],
                  maxRows: Infinity,
                }}
                dragConfig={{
                  enabled: true,
                  bounded: false,
                  handle: "[data-drag-handle]",
                  threshold: 3,
                }}
                resizeConfig={{
                  enabled: true,
                  handles: ["se"] as ["se"],
                }}
              >
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    onClick={() => setSelectedWidgetId(widget.id)}
                    className={cn(
                      "cursor-default",
                      selectedWidgetId === widget.id && "ring-2 ring-primary-400 ring-offset-1 rounded-sf",
                    )}
                  >
                    <WidgetWrapper
                      widget={widget}
                      dashFilters={{}}
                      isEditMode={true}
                      showDragHandle={true}
                      onDelete={(wid) => setDeleteConfirmId(wid)}
                      onEdit={(w) => setSelectedWidgetId(w.id)}
                    />
                  </div>
                ))}
              </GridLayout>
            </div>
          )}
        </main>

        {/* Right: widget settings */}
        <RightPanel
          widget={selectedWidget}
          onUpdate={handleWidgetUpdate}
          onClose={() => setSelectedWidgetId(null)}
        />
      </div>

      {/* ── Delete confirm dialog ─────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-sf shadow-xl w-72 p-5">
            <h2 className="text-sm font-semibold text-sf-text mb-2">ウィジェットを削除</h2>
            <p className="text-xs text-sf-weak mb-5">このウィジェットを削除しますか？</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
