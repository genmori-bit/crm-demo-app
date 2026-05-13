"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, formatAmount, formatDateTime } from "@/lib/utils";

interface Report {
  id: string;
  name: string;
  description: string | null;
  objectType: string;
  columns: string[];
  filters: { field: string; operator: string; value: string }[];
  sortField: string | null;
  sortDir: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string | null; email: string };
}

const COLUMN_LABELS: Record<string, string> = {
  dealName: "商談名",
  stage: "ステージ",
  amount: "金額",
  probability: "確度",
  expectedCloseDate: "クローズ予定日",
  nextAction: "次回アクション",
  createdAt: "登録日",
  "company.companyName": "顧客企業",
  "contact.fullName": "担当者",
  companyName: "会社名",
  industry: "業種",
  status: "ステータス",
  employeeSize: "規模",
  annualRevenue: "年商",
  fullName: "氏名",
  email: "メールアドレス",
  phone: "電話番号",
  department: "部署",
  title: "役職",
  type: "種別",
  subject: "件名",
  activityDate: "活動日",
};

function formatCellValue(col: string, val: unknown): string {
  if (val == null) return "-";
  if (col === "amount" || col === "annualRevenue") return formatAmount(Number(val));
  if (col === "probability") return `${val}%`;
  if (col === "expectedCloseDate" || col === "activityDate" || col === "createdAt") return formatDate(String(val));
  return String(val);
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.get<Report>(`/api/reports/${id}`).then(setReport);
  }, [id]);

  const runReport = async () => {
    setRunning(true);
    try {
      const result = await api.get<{ rows: Record<string, unknown>[] }>(`/api/reports/${id}/run`);
      setRows(result.rows);
    } catch {
      showToast("レポートの実行に失敗しました", "error");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (report) runReport();
  }, [report?.id]);

  if (!report) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border">
        <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 text-xs text-sf-weak">
          <Link href="/reports" className="hover:text-primary-500 hover:underline">レポート</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-sf-text">{report.name}</span>
        </div>
        <div className="px-6 pb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-sf-text">{report.name}</h1>
            {report.description && <p className="text-sm text-sf-weak mt-0.5">{report.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={runReport} disabled={running}>
              {running ? "実行中..." : "再実行"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/reports/${id}/add-to-dashboard`)}>ダッシュボードに追加</Button>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/reports/${id}/edit`)}>編集</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center gap-4 text-sm text-sf-weak">
          <span>作成者: {report.createdBy.name ?? report.createdBy.email}</span>
          <span>更新: {formatDateTime(report.updatedAt)}</span>
          {rows && <span className="font-semibold text-sf-text">{rows.length}件</span>}
        </div>

        {rows === null ? (
          <LightningCard><LightningCardBody><div className="py-8 text-center text-sf-weak">実行中...</div></LightningCardBody></LightningCard>
        ) : rows.length === 0 ? (
          <LightningCard><LightningCardBody><div className="py-8 text-center text-sf-weak">データがありません</div></LightningCardBody></LightningCard>
        ) : (
          <LightningCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/50">
                    {report.columns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide whitespace-nowrap">
                        {COLUMN_LABELS[col] ?? col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-sf-bg/40 transition-colors">
                      {report.columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-sf-text whitespace-nowrap">
                          {formatCellValue(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LightningCard>
        )}
      </div>
    </div>
  );
}
