"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { formatAmount, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  HorizontalBarChart,
  VerticalBarChart,
  DonutChart,
  LineChart,
  PieChart,
  FunnelChart,
} from "@/components/ui/simple-chart";
import type { ReportExecutionResult } from "@/lib/services/report-execution-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetSize = "SMALL" | "MEDIUM" | "LARGE" | "WIDE" | "FULL";
export type WidgetType =
  | "KPI"
  | "TABLE"
  | "BAR"
  | "LINE"
  | "PIE"
  | "DONUT"
  | "FUNNEL"
  | "RANKING"
  | "RISK_LIST";

export interface DashWidget {
  id: string;
  title: string;
  widgetType: string;
  size: WidgetSize;
  sortOrder: number;
  config: Record<string, unknown>;
  position: Record<string, unknown>;
  report: { id: string; name: string; objectType: string; isPublic: boolean; createdById: string };
  dashboardId: string;
}

export interface DashboardFilters {
  dateRange?: string;
  stage?: string;
  companyStatus?: string;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export const SIZE_COLS: Record<WidgetSize, string> = {
  SMALL: "col-span-3",
  MEDIUM: "col-span-4",
  LARGE: "col-span-6",
  WIDE: "col-span-8",
  FULL: "col-span-12",
};

const SIZE_MIN_H: Record<WidgetSize, string> = {
  SMALL: "min-h-[120px]",
  MEDIUM: "min-h-[140px]",
  LARGE: "min-h-[280px]",
  WIDE: "min-h-[220px]",
  FULL: "min-h-[320px]",
};

// ─── Value formatters ─────────────────────────────────────────────────────────

function formatValue(value: number, format?: string): string {
  if (format === "currency") return formatAmount(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億円`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(0)}万円`;
  return value.toLocaleString("ja-JP");
}

// ─── KPI Widget ───────────────────────────────────────────────────────────────

const KPI_ICONS: Record<string, React.ReactNode> = {
  count: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  sumAmount: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  overdueCount: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

function KpiWidget({
  data,
  config,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
}) {
  const format = String(config.format ?? "number");
  const metric = String(config.metric ?? "count");

  let value = 0;
  if (metric === "sumAmount") value = Number(data.summary.sumAmount ?? 0);
  else if (metric === "weightedAmount") value = Number(data.summary.weightedAmount ?? 0);
  else if (metric === "overdueCount") value = Number(data.summary.overdueCount ?? 0);
  else value = Number(data.summary.count ?? 0);

  const isRisk = metric === "overdueCount";
  const iconKey = metric === "sumAmount" || metric === "weightedAmount" ? "sumAmount" : metric === "overdueCount" ? "overdueCount" : "count";

  return (
    <div className="flex flex-col justify-between h-full px-5 py-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isRisk ? "bg-danger-light text-danger" : "bg-info-light text-primary-600"}`}>
        {KPI_ICONS[iconKey]}
      </div>
      <div className="mt-3">
        <p className={`text-3xl font-bold tracking-tight ${isRisk && value > 0 ? "text-danger" : "text-sf-text"}`}>
          {formatValue(value, format)}
        </p>
        <p className="text-xs text-sf-weak mt-1">
          {data.totalCount > 0 ? `全 ${data.totalCount.toLocaleString()} 件中` : "データなし"}
        </p>
      </div>
    </div>
  );
}

// ─── Table Widget ─────────────────────────────────────────────────────────────

const COL_LABELS: Record<string, string> = {
  dealName: "商談名",
  stage: "ステージ",
  amount: "金額",
  probability: "確度",
  expectedCloseDate: "クローズ予定",
  "company.companyName": "企業",
  "contact.fullName": "担当者",
  type: "種別",
  subject: "件名",
  activityDate: "活動日",
  title: "タイトル",
  status: "ステータス",
  priority: "優先度",
  dueDate: "期限",
  companyName: "企業名",
  industry: "業種",
};

function TableWidget({
  data,
  config,
  reportId,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
  reportId: string;
}) {
  const limit = Number(config.limit) || 5;
  const cols = (data.columns.length > 0 ? data.columns : ["subject"]).slice(0, 4);
  const rows = data.rows.slice(0, limit);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-sf-weak">
        <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-xs">データがありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-sf-surface z-10">
            <tr className="border-b border-sf-border">
              {cols.map((c) => (
                <th key={c} className="px-3 py-1.5 text-left font-semibold text-sf-weak whitespace-nowrap">
                  {COL_LABELS[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border/50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-sf-bg/40 transition-colors">
                {cols.map((col) => {
                  const val = row[col];
                  let display: React.ReactNode = val != null ? String(val) : "—";
                  if (col === "amount") display = formatAmount(Number(val));
                  if (col === "probability") display = `${val}%`;
                  if (["expectedCloseDate", "activityDate", "dueDate"].includes(col)) {
                    display = formatDate(String(val));
                  }
                  return (
                    <td key={col} className="px-3 py-2 text-sf-text">
                      {col === cols[0] && row.href ? (
                        <Link href={String(row.href)} className="text-primary-500 hover:underline truncate block max-w-[180px]">
                          {display}
                        </Link>
                      ) : (
                        <span className="truncate block max-w-[140px]">{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.totalCount > limit && (
        <div className="shrink-0 border-t border-sf-border px-3 py-2 flex items-center justify-between">
          <span className="text-2xs text-sf-weak">上位 {limit} 件を表示（全 {data.totalCount.toLocaleString()} 件）</span>
          <Link href={`/reports/${reportId}`} className="text-2xs text-primary-500 hover:underline">
            すべて見る →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Chart Widgets ─────────────────────────────────────────────────────────────

function BarWidget({
  data,
  config,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
}) {
  if (data.chartData.length === 0) {
    return <NoDataPlaceholder />;
  }
  const orientation = String(config.orientation ?? "horizontal");
  const isCount = config.yAxis === "count";
  const valueFmt = (v: number) => formatValue(v, isCount ? "number" : "currency");

  if (orientation === "vertical") {
    return <VerticalBarChart data={data.chartData} height={170} valueFormatter={valueFmt} />;
  }
  return <HorizontalBarChart data={data.chartData} valueFormatter={valueFmt} />;
}

function LineWidget({
  data,
  config,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
}) {
  if (data.chartData.length === 0) return <NoDataPlaceholder />;
  const metric = String(config.metric ?? "amount");
  const valueFmt = (v: number) => formatValue(v, metric === "amount" ? "currency" : "number");
  return <LineChart data={data.chartData} height={170} valueFormatter={valueFmt} />;
}

function PieWidget({ data }: { data: ReportExecutionResult }) {
  if (data.chartData.length === 0) return <NoDataPlaceholder />;
  return <PieChart data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))} size={110} />;
}

function DonutWidget({ data }: { data: ReportExecutionResult }) {
  if (data.chartData.length === 0) return <NoDataPlaceholder />;
  return (
    <DonutChart
      data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))}
      size={110}
      centerLabel="合計"
    />
  );
}

function FunnelWidget({
  data,
  config,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
}) {
  if (data.chartData.length === 0) return <NoDataPlaceholder />;
  const metric = String(config.metric ?? "amount");
  const valueFmt = (v: number) => formatValue(v, metric === "amount" ? "currency" : "number");
  return (
    <FunnelChart
      data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))}
      valueFormatter={valueFmt}
    />
  );
}

// ─── Ranking Widget ────────────────────────────────────────────────────────────

const RANK_COLORS = [
  "text-yellow-500",
  "text-slate-400",
  "text-amber-600",
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function RankingWidget({
  data,
  config,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
}) {
  const limit = Number(config.limit) || 5;
  const isCount = config.metric !== "amount";
  const valueFmt = (v: number) => formatValue(v, isCount ? "number" : "currency");

  const items = data.chartData.slice(0, limit);
  if (items.length === 0) return <NoDataPlaceholder />;

  const max = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-2.5 py-1">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className={`text-sm font-bold w-5 shrink-0 ${i < 3 ? RANK_COLORS[i] : "text-sf-weak"}`}>
            {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-sf-text truncate font-medium">{item.label}</span>
              <span className="text-xs font-semibold text-sf-text ml-2 shrink-0">{valueFmt(item.value)}</span>
            </div>
            <div className="h-1 bg-sf-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-400 transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Risk List Widget ─────────────────────────────────────────────────────────

function RiskListWidget({
  data,
  config,
  reportId,
}: {
  data: ReportExecutionResult;
  config: Record<string, unknown>;
  reportId: string;
}) {
  const limit = Number(config.limit) || 5;
  const rows = data.rows.slice(0, limit);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <svg className="w-8 h-8 text-success/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-sf-weak">リスク案件はありません</p>
      </div>
    );
  }

  const cols = (data.columns.length > 0 ? data.columns : ["dealName", "stage", "expectedCloseDate"]).slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-1.5">
        {rows.map((row, i) => {
          const name = row[cols[0]];
          const sub1 = row[cols[1]];
          const sub2 = row[cols[2]];
          return (
            <div key={i} className="flex items-start gap-2.5 px-1 py-1.5 rounded-lg hover:bg-danger-light/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {row.href ? (
                    <Link href={String(row.href)} className="text-xs font-medium text-primary-600 hover:underline truncate">
                      {name != null ? String(name) : "—"}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-sf-text truncate">
                      {name != null ? String(name) : "—"}
                    </span>
                  )}
                </div>
                <p className="text-2xs text-sf-weak mt-0.5 truncate">
                  {[sub1, sub2].filter(Boolean).map(String).join(" · ")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {data.totalCount > limit && (
        <div className="shrink-0 border-t border-sf-border px-1 pt-2 mt-1">
          <Link href={`/reports/${reportId}`} className="text-2xs text-primary-500 hover:underline">
            全 {data.totalCount.toLocaleString()} 件を見る →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function NoDataPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-sf-weak">
      <svg className="w-8 h-8 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs">データがありません</p>
    </div>
  );
}

// ─── Widget Skeleton ──────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-3 h-full p-1 animate-pulse">
      <div className="h-3 bg-sf-border rounded w-1/3" />
      <div className="h-8 bg-sf-border rounded w-1/2" />
      <div className="h-2 bg-sf-border/60 rounded w-full" />
      <div className="h-2 bg-sf-border/60 rounded w-4/5" />
      <div className="h-2 bg-sf-border/60 rounded w-3/5" />
    </div>
  );
}

// ─── Widget Wrapper ───────────────────────────────────────────────────────────

interface WidgetWrapperProps {
  widget: DashWidget;
  dashFilters: DashboardFilters;
  isEditMode?: boolean;
  /** When true, the drag handle is shown (builder mode) */
  showDragHandle?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (widget: DashWidget) => void;
}

export function WidgetWrapper({
  widget,
  dashFilters,
  isEditMode,
  showDragHandle,
  onDelete,
  onEdit,
}: WidgetWrapperProps) {
  const [data, setData] = useState<ReportExecutionResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (dashFilters.dateRange) params.set("dateRange", dashFilters.dateRange);
      if (dashFilters.stage) params.set("stage", dashFilters.stage);
      if (dashFilters.companyStatus) params.set("companyStatus", dashFilters.companyStatus);
      const result = await api.get<ReportExecutionResult>(
        `/api/dashboards/${widget.dashboardId}/widgets/${widget.id}/execute?${params}`,
      );
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [widget.id, widget.dashboardId, dashFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const sizeCol = SIZE_COLS[widget.size] ?? SIZE_COLS.MEDIUM;
  const minH = SIZE_MIN_H[widget.size] ?? SIZE_MIN_H.MEDIUM;

  return (
    <div
      className={cn(
        "bg-sf-surface border border-sf-border rounded-sf shadow-card flex flex-col overflow-hidden",
        "transition-shadow",
        isEditMode && "border-primary-200 shadow-[0_0_0_2px_rgba(1,118,211,0.1)]",
        sizeCol,
        minH,
      )}
    >
      {/* Widget header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b border-sf-border/70 shrink-0",
          showDragHandle && "cursor-grab active:cursor-grabbing",
        )}
        data-drag-handle={showDragHandle ? "true" : undefined}
      >
        {showDragHandle && (
          <div className="mr-2 text-sf-weak/40 shrink-0" aria-hidden="true">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
            </svg>
          </div>
        )}
        <h3 className="text-xs font-semibold text-sf-text truncate flex-1">{widget.title}</h3>
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {/* Refresh */}
          <button
            onClick={load}
            className="p-1 text-sf-weak/60 hover:text-sf-text rounded transition-colors"
            title="更新"
            aria-label="データを更新"
          >
            <svg className={cn("w-3 h-3", loading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 text-sf-weak/60 hover:text-sf-text rounded transition-colors"
              aria-label="メニュー"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white border border-sf-border rounded-sf shadow-dropdown z-50 py-1"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <Link
                  href={`/reports/${widget.report.id}`}
                  className="block px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg"
                  onClick={() => setMenuOpen(false)}
                >
                  レポートを開く
                </Link>
                {isEditMode && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit?.(widget);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg"
                    >
                      設定を編集
                    </button>
                    <div className="border-t border-sf-border my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete?.(widget.id);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger-light"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget body */}
      <div className="flex-1 overflow-hidden p-3">
        {loading && <WidgetSkeleton />}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <svg
              className="w-7 h-7 text-danger/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-sf-weak">データの取得に失敗しました</p>
            <button onClick={load} className="text-xs text-primary-500 hover:underline">
              再試行
            </button>
          </div>
        )}
        {data && !loading && !error && (
          <>
            {widget.widgetType === "KPI" && <KpiWidget data={data} config={widget.config} />}
            {widget.widgetType === "TABLE" && (
              <TableWidget data={data} config={widget.config} reportId={widget.report.id} />
            )}
            {widget.widgetType === "BAR" && <BarWidget data={data} config={widget.config} />}
            {widget.widgetType === "LINE" && <LineWidget data={data} config={widget.config} />}
            {widget.widgetType === "PIE" && <PieWidget data={data} />}
            {widget.widgetType === "DONUT" && <DonutWidget data={data} />}
            {widget.widgetType === "FUNNEL" && <FunnelWidget data={data} config={widget.config} />}
            {widget.widgetType === "RANKING" && (
              <RankingWidget data={data} config={widget.config} />
            )}
            {widget.widgetType === "RISK_LIST" && (
              <RiskListWidget data={data} config={widget.config} reportId={widget.report.id} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
