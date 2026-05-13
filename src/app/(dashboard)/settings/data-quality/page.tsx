"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Issue {
  id: string;
  objectType: string;
  objectId: string;
  objectName: string;
  issueType: string;
  field?: string;
  href: string;
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  missing_field: "必須項目未入力",
  zero_amount: "金額が0",
  missing_next_action: "次回アクション未設定",
  no_contact_info: "連絡先情報なし",
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  company: "企業",
  contact: "担当者",
  deal: "商談",
};

const FIELD_LABELS: Record<string, string> = {
  industry: "業種",
  phone: "電話番号",
  email: "メールアドレス",
  expectedCloseDate: "クローズ予定日",
};

export default function DataQualityPage() {
  const [data, setData] = useState<{ issues: Issue[]; summary: Record<string, number> } | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api.get<{ issues: Issue[]; summary: Record<string, number> }>("/api/data-quality").then(setData);
  }, []);

  if (!data) return <PageLoading />;

  const filtered = filter === "all" ? data.issues : data.issues.filter((i) => i.issueType === filter);

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">データ品質チェック</h1>
      </div>

      <div className="p-6 space-y-4 max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.summary).map(([type, count]) => (
            <div key={type} className="bg-sf-surface border border-sf-border rounded-sf px-4 py-3">
              <p className="text-2xl font-bold text-danger">{count}</p>
              <p className="text-xs text-sf-weak mt-0.5">{ISSUE_TYPE_LABELS[type] ?? type}</p>
            </div>
          ))}
          {Object.keys(data.summary).length === 0 && (
            <div className="col-span-4 bg-success/10 border border-success/30 rounded-sf px-4 py-3">
              <p className="text-sm font-medium text-success">データ品質の問題はありません</p>
            </div>
          )}
        </div>

        <LightningCard>
          <LightningCardHeader
            title={`問題一覧 (${filtered.length}件)`}
            action={
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2 py-1 border border-sf-border rounded text-xs bg-white focus:outline-none"
              >
                <option value="all">すべて</option>
                {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            }
          />
          {filtered.length === 0 ? (
            <LightningCardBody>
              <p className="text-sm text-sf-weak text-center py-4">問題はありません</p>
            </LightningCardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">オブジェクト</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">名前</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">問題</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">対象項目</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {filtered.map((issue) => (
                    <tr key={issue.id} className="hover:bg-sf-bg/40">
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          issue.objectType === "company" ? "bg-primary-50 text-primary-600" :
                          issue.objectType === "contact" ? "bg-purple-50 text-purple-600" :
                          "bg-orange-50 text-orange-600"
                        )}>
                          {OBJECT_TYPE_LABELS[issue.objectType] ?? issue.objectType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sf-text font-medium">{issue.objectName}</td>
                      <td className="px-4 py-3 text-danger text-xs">{ISSUE_TYPE_LABELS[issue.issueType] ?? issue.issueType}</td>
                      <td className="px-4 py-3 text-sf-weak text-xs">{issue.field ? (FIELD_LABELS[issue.field] ?? issue.field) : "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={issue.href} className="text-xs text-primary-500 hover:underline">修正</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LightningCard>
      </div>
    </div>
  );
}
