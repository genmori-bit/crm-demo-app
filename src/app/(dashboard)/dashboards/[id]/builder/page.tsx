"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

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
}

const OBJECT_TYPE_LABELS: Record<string, string> = {
  deal: "商談",
  company: "企業",
  contact: "担当者",
  activity: "活動",
};

const WIDGET_TYPES = [
  { value: "KPI", label: "KPI", desc: "単一の数値を大きく表示", icon: "📊" },
  { value: "TABLE", label: "テーブル", desc: "一覧データを表示", icon: "📋" },
  { value: "BAR", label: "棒グラフ", desc: "カテゴリ別の比較", icon: "📈" },
  { value: "LINE", label: "折れ線グラフ", desc: "時系列の推移", icon: "📉" },
  { value: "PIE", label: "円グラフ", desc: "割合の可視化", icon: "🥧" },
  { value: "DONUT", label: "ドーナツグラフ", desc: "割合と合計の表示", icon: "🍩" },
  { value: "FUNNEL", label: "ファネル", desc: "段階別の変換率", icon: "🔻" },
];

const SIZE_OPTIONS = [
  { value: "SMALL", label: "小（1列）" },
  { value: "MEDIUM", label: "中（2列）" },
  { value: "LARGE", label: "大（2列×2行）" },
  { value: "WIDE", label: "横長（4列）" },
  { value: "FULL", label: "フル（4列×2行）" },
];

type Step = "report" | "type" | "config";

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [step, setStep] = useState<Step>("report");
  const [search, setSearch] = useState("");
  const [objectFilter, setObjectFilter] = useState("");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [widgetType, setWidgetType] = useState("TABLE");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetSize, setWidgetSize] = useState("MEDIUM");
  const [widgetConfig, setWidgetConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Dashboard>(`/api/dashboards/${id}`).then(setDashboard).catch(() => {});
    api.get<Report[]>("/api/reports").then(setReports);
  }, [id]);

  const filteredReports = reports?.filter((r) => {
    const matchObj = !objectFilter || r.objectType === objectFilter;
    const matchSearch = !search || r.name.includes(search) || (r.description ?? "").includes(search);
    return matchObj && matchSearch;
  });

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setWidgetTitle(report.name);
    setStep("type");
  };

  const handleSelectType = (type: string) => {
    setWidgetType(type);
    setWidgetConfig({});
    setStep("config");
  };

  const handleSave = async () => {
    if (!selectedReport) return;
    setSaving(true);
    try {
      await api.post(`/api/dashboards/${id}/widgets`, {
        reportId: selectedReport.id,
        title: widgetTitle || selectedReport.name,
        widgetType,
        size: widgetSize,
        config: widgetConfig,
      });
      showToast("ウィジェットを追加しました");
      router.push(`/dashboards/${id}`);
    } catch {
      showToast("追加に失敗しました", "error");
      setSaving(false);
    }
  };

  if (!reports || !dashboard) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xs text-sf-weak mb-0.5">
            <Link href="/dashboards" className="hover:text-primary-500">ダッシュボード</Link>
            <span>/</span>
            <Link href={`/dashboards/${id}`} className="hover:text-primary-500">{dashboard.name}</Link>
            <span>/</span>
            <span>ウィジェット追加</span>
          </div>
          <h1 className="text-xl font-bold text-sf-text">ウィジェットを追加</h1>
        </div>
        <Link href={`/dashboards/${id}`}>
          <Button variant="secondary" size="sm">キャンセル</Button>
        </Link>
      </div>

      {/* Step indicator */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-2">
        <div className="flex items-center gap-3">
          {[
            { key: "report", label: "1. レポートを選択" },
            { key: "type", label: "2. ウィジェットタイプ" },
            { key: "config", label: "3. 設定・保存" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              {i > 0 && <span className="text-sf-weak">›</span>}
              <button
                onClick={() => {
                  if (s.key === "report") setStep("report");
                  if (s.key === "type" && selectedReport) setStep("type");
                }}
                className={`text-xs font-medium ${
                  step === s.key ? "text-primary-500" : selectedReport ? "text-sf-weak hover:text-sf-text" : "text-sf-weak/40"
                }`}
                disabled={s.key === "type" && !selectedReport || s.key === "config" && !selectedReport}
              >
                {s.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Select report */}
        {step === "report" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={objectFilter}
                onChange={(e) => setObjectFilter(e.target.value)}
                className="border border-sf-border rounded-sf px-2 py-1.5 text-xs text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">全オブジェクト</option>
                {Object.entries(OBJECT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="レポートを検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-sf-border rounded-sf px-3 py-1.5 text-xs bg-sf-surface text-sf-text focus:outline-none focus:ring-1 focus:ring-primary-500 w-56"
              />
            </div>

            {!filteredReports || filteredReports.length === 0 ? (
              <LightningCard>
                <LightningCardBody>
                  <p className="text-center text-sf-weak py-8">
                    {search || objectFilter ? "レポートが見つかりません" : "レポートがありません。先にレポートを作成してください。"}
                  </p>
                  {!search && !objectFilter && (
                    <div className="flex justify-center mt-2">
                      <Link href="/reports/new"><Button size="sm">レポートを作成</Button></Link>
                    </div>
                  )}
                </LightningCardBody>
              </LightningCard>
            ) : (
              <LightningCard>
                <div className="divide-y divide-sf-border">
                  {filteredReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className="w-full text-left px-4 py-3 hover:bg-sf-bg/50 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-sm font-medium text-sf-text group-hover:text-primary-500">{report.name}</p>
                        <p className="text-xs text-sf-weak mt-0.5">
                          {OBJECT_TYPE_LABELS[report.objectType] ?? report.objectType}
                          {report.description && ` · ${report.description}`}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-sf-weak group-hover:text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </LightningCard>
            )}
          </div>
        )}

        {/* Step 2: Widget type */}
        {step === "type" && selectedReport && (
          <div className="space-y-4">
            <p className="text-sm text-sf-weak">
              レポート: <span className="font-medium text-sf-text">{selectedReport.name}</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {WIDGET_TYPES.map((wt) => (
                <button
                  key={wt.value}
                  onClick={() => handleSelectType(wt.value)}
                  className="bg-sf-surface border border-sf-border rounded-sf p-4 text-left hover:border-primary-500 hover:shadow-card transition-all group"
                >
                  <div className="text-2xl mb-2">{wt.icon}</div>
                  <p className="text-sm font-semibold text-sf-text group-hover:text-primary-500">{wt.label}</p>
                  <p className="text-xs text-sf-weak mt-0.5">{wt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Config */}
        {step === "config" && selectedReport && (
          <div className="space-y-4 max-w-lg">
            <p className="text-sm text-sf-weak">
              レポート: <span className="font-medium text-sf-text">{selectedReport.name}</span>
              {" · "}
              タイプ: <span className="font-medium text-sf-text">{WIDGET_TYPES.find((w) => w.value === widgetType)?.label}</span>
            </p>

            <LightningCard>
              <LightningCardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-sf-text mb-1">ウィジェットタイトル</label>
                    <input
                      type="text"
                      value={widgetTitle}
                      onChange={(e) => setWidgetTitle(e.target.value)}
                      className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sf-text mb-1">サイズ</label>
                    <select
                      value={widgetSize}
                      onChange={(e) => setWidgetSize(e.target.value)}
                      className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* KPI config */}
                  {widgetType === "KPI" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-sf-text mb-1">表示指標</label>
                        <select
                          value={widgetConfig.metric ?? "count"}
                          onChange={(e) => setWidgetConfig({ ...widgetConfig, metric: e.target.value })}
                          className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="count">件数</option>
                          <option value="sumAmount">合計金額</option>
                          <option value="weightedAmount">加重合計金額</option>
                          <option value="overdueCount">期限超過件数</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-sf-text mb-1">表示形式</label>
                        <select
                          value={widgetConfig.format ?? "number"}
                          onChange={(e) => setWidgetConfig({ ...widgetConfig, format: e.target.value })}
                          className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="number">数値</option>
                          <option value="currency">金額</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Table config */}
                  {widgetType === "TABLE" && (
                    <div>
                      <label className="block text-xs font-semibold text-sf-text mb-1">表示件数</label>
                      <select
                        value={widgetConfig.limit ?? "10"}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, limit: e.target.value })}
                        className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="5">5件</option>
                        <option value="10">10件</option>
                        <option value="20">20件</option>
                        <option value="50">50件</option>
                      </select>
                    </div>
                  )}

                  {/* Bar config */}
                  {widgetType === "BAR" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-sf-text mb-1">方向</label>
                        <select
                          value={widgetConfig.orientation ?? "horizontal"}
                          onChange={(e) => setWidgetConfig({ ...widgetConfig, orientation: e.target.value })}
                          className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="horizontal">横棒</option>
                          <option value="vertical">縦棒</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-sf-text mb-1">Y軸</label>
                        <select
                          value={widgetConfig.yAxis ?? "amount"}
                          onChange={(e) => setWidgetConfig({ ...widgetConfig, yAxis: e.target.value })}
                          className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="amount">金額</option>
                          <option value="count">件数</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Line / Funnel config */}
                  {(widgetType === "LINE" || widgetType === "FUNNEL") && (
                    <div>
                      <label className="block text-xs font-semibold text-sf-text mb-1">表示指標</label>
                      <select
                        value={widgetConfig.metric ?? "amount"}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, metric: e.target.value })}
                        className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="amount">金額</option>
                        <option value="count">件数</option>
                      </select>
                    </div>
                  )}
                </div>
              </LightningCardBody>
            </LightningCard>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setStep("type")}>戻る</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "追加中..." : "ウィジェットを追加"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
