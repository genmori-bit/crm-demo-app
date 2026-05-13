"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface Report {
  id: string;
  name: string;
  description: string | null;
  objectType: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string | null; email: string };
}

const OBJECT_TYPE_LABELS: Record<string, string> = {
  deal: "商談",
  company: "企業",
  contact: "担当者",
  activity: "活動",
};

export default function ReportsPage() {
  const showToast = useToast();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get<Report[]>("/api/reports").then(setReports);
  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/reports/${deleteId}`);
      showToast("レポートを削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!reports) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">レポート</p>
          <h1 className="text-xl font-bold text-sf-text">レポート一覧</h1>
        </div>
        <Link href="/reports/new">
          <Button size="sm">新規レポート</Button>
        </Link>
      </div>

      <div className="p-6">
        {reports.length === 0 ? (
          <LightningCard>
            <LightningCardBody>
              <p className="text-center text-sf-weak py-8">レポートがありません。新規レポートを作成してください。</p>
            </LightningCardBody>
          </LightningCard>
        ) : (
          <LightningCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">レポート名</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">対象</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">公開</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">作成者</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">更新日時</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-sf-bg/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/reports/${r.id}`} className="font-medium text-primary-500 hover:underline">
                          {r.name}
                        </Link>
                        {r.description && <p className="text-xs text-sf-weak mt-0.5">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-sf-text">
                        <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-xs font-medium">
                          {OBJECT_TYPE_LABELS[r.objectType] ?? r.objectType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sf-text">
                        {r.isPublic ? (
                          <span className="text-xs text-success font-medium">公開</span>
                        ) : (
                          <span className="text-xs text-sf-weak">非公開</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sf-weak text-xs">{r.createdBy.name ?? r.createdBy.email}</td>
                      <td className="px-4 py-3 text-sf-weak text-xs">{formatDateTime(r.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/reports/${r.id}/edit`} className="text-xs text-primary-500 hover:underline">編集</Link>
                          <button onClick={() => setDeleteId(r.id)} className="text-xs text-danger hover:underline">削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LightningCard>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="レポートの削除"
        message="このレポートを削除しますか？"
        loading={deleting}
      />
    </div>
  );
}
