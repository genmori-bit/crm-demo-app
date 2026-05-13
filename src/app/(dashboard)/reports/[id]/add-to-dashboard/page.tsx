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
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  _count: { widgets: number };
}

const WIDGET_TYPES = [
  { value: "TABLE", label: "テーブル" },
  { value: "KPI", label: "KPI" },
  { value: "BAR", label: "棒グラフ" },
  { value: "LINE", label: "折れ線グラフ" },
  { value: "PIE", label: "円グラフ" },
  { value: "DONUT", label: "ドーナツグラフ" },
  { value: "FUNNEL", label: "ファネル" },
];

export default function AddToDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[] | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [widgetType, setWidgetType] = useState("TABLE");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetSize, setWidgetSize] = useState("MEDIUM");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Report>(`/api/reports/${id}`).then((r) => {
      setReport(r);
      setWidgetTitle(r.name);
    }).catch(() => {});
    api.get<Dashboard[]>("/api/dashboards?filter=all").then(setDashboards);
  }, [id]);

  const handleSave = async () => {
    if (!selectedDashboard) return;
    setSaving(true);
    try {
      await api.post(`/api/dashboards/${selectedDashboard}/widgets`, {
        reportId: id,
        title: widgetTitle,
        widgetType,
        size: widgetSize,
        config: {},
      });
      showToast("ダッシュボードに追加しました");
      router.push(`/dashboards/${selectedDashboard}`);
    } catch {
      showToast("追加に失敗しました", "error");
      setSaving(false);
    }
  };

  if (!report || !dashboards) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xs text-sf-weak mb-0.5">
            <Link href="/reports" className="hover:text-primary-500">レポート</Link>
            <span>/</span>
            <Link href={`/reports/${id}`} className="hover:text-primary-500">{report.name}</Link>
            <span>/</span>
            <span>ダッシュボードに追加</span>
          </div>
          <h1 className="text-xl font-bold text-sf-text">ダッシュボードに追加</h1>
        </div>
        <Link href={`/reports/${id}`}>
          <Button variant="secondary" size="sm">キャンセル</Button>
        </Link>
      </div>

      <div className="p-6 max-w-lg space-y-4">
        <p className="text-sm text-sf-weak">
          レポート <span className="font-medium text-sf-text">「{report.name}」</span> をダッシュボードに追加します。
        </p>

        {dashboards.length === 0 ? (
          <LightningCard>
            <LightningCardBody>
              <p className="text-center text-sf-weak py-6">ダッシュボードがありません。先に作成してください。</p>
              <div className="flex justify-center">
                <Link href="/dashboards/new"><Button size="sm">ダッシュボードを作成</Button></Link>
              </div>
            </LightningCardBody>
          </LightningCard>
        ) : (
          <LightningCard>
            <LightningCardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-sf-text mb-1">
                    追加先ダッシュボード <span className="text-danger">*</span>
                  </label>
                  <select
                    value={selectedDashboard}
                    onChange={(e) => setSelectedDashboard(e.target.value)}
                    className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">-- 選択してください --</option>
                    {dashboards.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d._count.widgets}ウィジェット)
                      </option>
                    ))}
                  </select>
                </div>

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
                  <label className="block text-xs font-semibold text-sf-text mb-1">ウィジェットタイプ</label>
                  <select
                    value={widgetType}
                    onChange={(e) => setWidgetType(e.target.value)}
                    className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {WIDGET_TYPES.map((wt) => (
                      <option key={wt.value} value={wt.value}>{wt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sf-text mb-1">サイズ</label>
                  <select
                    value={widgetSize}
                    onChange={(e) => setWidgetSize(e.target.value)}
                    className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="SMALL">小（1列）</option>
                    <option value="MEDIUM">中（2列）</option>
                    <option value="LARGE">大（2列×2行）</option>
                    <option value="WIDE">横長（4列）</option>
                    <option value="FULL">フル（4列×2行）</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Link href={`/reports/${id}`}>
                    <Button variant="secondary" size="sm" type="button">キャンセル</Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !selectedDashboard}
                  >
                    {saving ? "追加中..." : "ダッシュボードに追加"}
                  </Button>
                </div>
              </div>
            </LightningCardBody>
          </LightningCard>
        )}
      </div>
    </div>
  );
}
