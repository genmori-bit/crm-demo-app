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

export type WidgetSize = "SMALL" | "MEDIUM" | "LARGE" | "WIDE" | "FULL";

export interface DashWidget {
  id: string;
  title: string;
  widgetType: string;
  size: WidgetSize;
  sortOrder: number;
  config: Record<string, unknown>;
  report: { id: string; name: string; objectType: string; isPublic: boolean; createdById: string };
  dashboardId: string;
}

interface DashboardFilters {
  dateRange?: string;
  stage?: string;
  companyStatus?: string;
}

const SIZE_COLS: Record<WidgetSize, string> = {
  SMALL: "col-span-1",
  MEDIUM: "col-span-2",
  LARGE: "col-span-2 row-span-2",
  WIDE: "col-span-4",
  FULL: "col-span-4 row-span-2",
};

const SIZE_MIN_H: Record<WidgetSize, string> = {
  SMALL: "min-h-[140px]",
  MEDIUM: "min-h-[160px]",
  LARGE: "min-h-[320px]",
  WIDE: "min-h-[180px]",
  FULL: "min-h-[360px]",
};

function formatValue(value: number, format?: string) {
  if (format === "currency") return formatAmount(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}億円`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}万円`;
  return value.toLocaleString("ja-JP");
}

// ── KPI Widget ────────────────────────────────────────────────────────────

function KpiWidget({ data, config }: { data: ReportExecutionResult; config: Record<string, unknown> }) {
  const format = String(config.format ?? "number");
  const metric = String(config.metric ?? "count");
  let value = 0;
  if (metric === "sumAmount") value = (data.summary.sumAmount as number) ?? 0;
  else if (metric === "weightedAmount") value = (data.summary.weightedAmount as number) ?? 0;
  else if (metric === "overdueCount") value = (data.summary.overdueCount as number) ?? 0;
  else value = data.summary.count ?? 0;

  return (
    <div className="flex flex-col items-start justify-center h-full px-4 py-3">
      <p className="text-3xl font-bold text-sf-text">{formatValue(value, format)}</p>
      <p className="text-xs text-sf-weak mt-1">全{data.totalCount}件</p>
      <p className="text-2xs text-sf-weak/60 mt-auto">{formatDateTime(data.executedAt)}</p>
    </div>
  );
}

// ── Table Widget ──────────────────────────────────────────────────────────

const COL_LABELS: Record<string, string> = {
  dealName: "商談名", stage: "ステージ", amount: "金額", probability: "確度",
  expectedCloseDate: "クローズ予定", "company.companyName": "企業", "contact.fullName": "担当者",
  type: "種別", subject: "件名", activityDate: "活動日",
  title: "タイトル", status: "ステータス", priority: "優先度", dueDate: "期限",
  companyName: "企業名", industry: "業種",
};

function TableWidget({ data, config }: { data: ReportExecutionResult; config: Record<string, unknown> }) {
  const cols = (data.columns.length > 0 ? data.columns : ["subject"]).slice(0, 5);
  if (data.rows.length === 0) {
    return <div className="flex items-center justify-center h-20 text-sm text-sf-weak">データがありません</div>;
  }
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-sf-border bg-sf-bg/40">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-sf-weak whitespace-nowrap">{COL_LABELS[c] ?? c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sf-border">
          {data.rows.slice(0, Number(config.limit) || 10).map((row, i) => (
            <tr key={i} className="hover:bg-sf-bg/30">
              {cols.map((col) => {
                const val = row[col];
                let display: React.ReactNode = val != null ? String(val) : "-";
                if (col === "amount") display = formatAmount(Number(val));
                if (col === "probability") display = `${val}%`;
                if (col === "expectedCloseDate" || col === "activityDate" || col === "dueDate") display = formatDate(String(val));

                return (
                  <td key={col} className="px-3 py-2 text-sf-text whitespace-nowrap">
                    {col === cols[0] && row.href ? (
                      <Link href={String(row.href)} className="text-primary-500 hover:underline truncate block max-w-[180px]">{display}</Link>
                    ) : (
                      <span className="truncate block max-w-[160px]">{display}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Chart Widgets ─────────────────────────────────────────────────────────

function BarWidget({ data, config }: { data: ReportExecutionResult; config: Record<string, unknown> }) {
  if (data.chartData.length === 0) return <div className="flex items-center justify-center h-24 text-sm text-sf-weak">データがありません</div>;
  const orientation = String(config.orientation ?? "horizontal");
  const fmt = String(config.yAxis === "count" ? "number" : "currency");
  const valueFmt = (v: number) => formatValue(v, fmt === "currency" ? "currency" : "number");

  if (orientation === "vertical") {
    return <VerticalBarChart data={data.chartData} height={160} valueFormatter={valueFmt} />;
  }
  return <HorizontalBarChart data={data.chartData} valueFormatter={valueFmt} />;
}

function LineWidget({ data, config }: { data: ReportExecutionResult; config: Record<string, unknown> }) {
  if (data.chartData.length === 0) return <div className="flex items-center justify-center h-24 text-sm text-sf-weak">データがありません</div>;
  const metric = String(config.metric ?? "amount");
  const valueFmt = (v: number) => formatValue(v, metric === "amount" ? "currency" : "number");
  return <LineChart data={data.chartData} height={160} valueFormatter={valueFmt} />;
}

function PieWidget({ data }: { data: ReportExecutionResult }) {
  if (data.chartData.length === 0) return <div className="flex items-center justify-center h-24 text-sm text-sf-weak">データがありません</div>;
  return <PieChart data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))} size={110} />;
}

function DonutWidget({ data }: { data: ReportExecutionResult }) {
  if (data.chartData.length === 0) return <div className="flex items-center justify-center h-24 text-sm text-sf-weak">データがありません</div>;
  return <DonutChart data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))} size={110} centerLabel="合計" />;
}

function FunnelWidget({ data, config }: { data: ReportExecutionResult; config: Record<string, unknown> }) {
  if (data.chartData.length === 0) return <div className="flex items-center justify-center h-24 text-sm text-sf-weak">データがありません</div>;
  const metric = String(config.metric ?? "amount");
  const valueFmt = (v: number) => formatValue(v, metric === "amount" ? "currency" : "number");
  return (
    <FunnelChart
      data={data.chartData.map((d) => ({ ...d, color: d.color ?? "#0176d3" }))}
      valueFormatter={valueFmt}
    />
  );
}

// ── Widget Wrapper ────────────────────────────────────────────────────────

interface WidgetWrapperProps {
  widget: DashWidget;
  dashFilters: DashboardFilters;
  isEditMode?: boolean;
  onDelete?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (widget: DashWidget) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function WidgetWrapper({
  widget,
  dashFilters,
  isEditMode,
  onDelete,
  onMoveUp,
  onMoveDown,
  onEdit,
  isFirst,
  isLast,
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
        `/api/dashboards/${widget.dashboardId}/widgets/${widget.id}/execute?${params}`
      );
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [widget.id, widget.dashboardId, dashFilters]);

  useEffect(() => { load(); }, [load]);

  const sizeCol = SIZE_COLS[widget.size] ?? SIZE_COLS.MEDIUM;
  const minH = SIZE_MIN_H[widget.size] ?? SIZE_MIN_H.MEDIUM;

  return (
    <div className={cn("bg-sf-surface border border-sf-border rounded-sf shadow-card flex flex-col", sizeCol, minH)}>
      {/* Widget header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sf-border shrink-0">
        <h3 className="text-xs font-semibold text-sf-text truncate">{widget.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {isEditMode && (
            <>
              {!isFirst && (
                <button onClick={() => onMoveUp?.(widget.id)} className="p-0.5 text-sf-weak hover:text-sf-text rounded" title="上へ">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
              )}
              {!isLast && (
                <button onClick={() => onMoveDown?.(widget.id)} className="p-0.5 text-sf-weak hover:text-sf-text rounded" title="下へ">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              )}
            </>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-0.5 text-sf-weak hover:text-sf-text rounded"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-sf-border rounded-sf shadow-dropdown z-50 py-1" onMouseLeave={() => setMenuOpen(false)}>
                <button onClick={() => { setMenuOpen(false); load(); }} className="w-full text-left px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg">更新</button>
                <Link href={`/reports/${widget.report.id}`} className="block px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg" onClick={() => setMenuOpen(false)}>レポートを開く</Link>
                {isEditMode && (
                  <>
                    <button onClick={() => { setMenuOpen(false); onEdit?.(widget); }} className="w-full text-left px-3 py-1.5 text-xs text-sf-text hover:bg-sf-bg">編集</button>
                    <button onClick={() => { setMenuOpen(false); onDelete?.(widget.id); }} className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger/5">削除</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget body */}
      <div className="flex-1 overflow-auto p-3">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <svg className="w-8 h-8 text-danger/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-xs text-sf-weak">データの取得に失敗しました</p>
            <button onClick={load} className="text-xs text-primary-500 hover:underline">再試行</button>
          </div>
        )}
        {data && !loading && !error && (
          <>
            {widget.widgetType === "KPI" && <KpiWidget data={data} config={widget.config} />}
            {widget.widgetType === "TABLE" && <TableWidget data={data} config={widget.config} />}
            {widget.widgetType === "BAR" && <BarWidget data={data} config={widget.config} />}
            {widget.widgetType === "LINE" && <LineWidget data={data} config={widget.config} />}
            {widget.widgetType === "PIE" && <PieWidget data={data} />}
            {widget.widgetType === "DONUT" && <DonutWidget data={data} />}
            {widget.widgetType === "FUNNEL" && <FunnelWidget data={data} config={widget.config} />}
          </>
        )}
      </div>
    </div>
  );
}
