"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  origin: string | null;
  type: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  company: { id: string; companyName: string } | null;
  contact: { id: string; fullName: string; email: string | null } | null;
  tasks: { id: string; title: string; status: string; dueDate: string | null }[];
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Open: "bg-yellow-100 text-yellow-700",
  "Pending Customer": "bg-orange-100 text-orange-700",
  Escalated: "bg-red-100 text-red-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState("");

  const load = () => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((data) => { setCaseRecord(data); setEditStatus(data.status); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { showToast("ステータスを更新しました", "success"); load(); }
    else showToast("更新に失敗しました", "error");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!caseRecord) return <div className="p-6 text-sf-weak">見つかりません</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/cases" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-2xs text-sf-weak">ケース #{caseRecord.caseNumber}</p>
          <h1 className="text-xl font-bold text-sf-text">{caseRecord.subject}</h1>
        </div>
        <select
          className="border border-sf-border rounded px-3 py-1.5 text-sm"
          value={editStatus}
          onChange={(e) => { setEditStatus(e.target.value); updateStatus(e.target.value); }}
        >
          <option value="New">新規</option>
          <option value="Open">対応中</option>
          <option value="Pending Customer">顧客待ち</option>
          <option value="Pending Internal">社内待ち</option>
          <option value="Escalated">エスカレート</option>
          <option value="Closed">クローズ</option>
        </select>
      </div>

      <div className="flex-1 p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
            <h2 className="text-sm font-semibold text-sf-text mb-4">詳細</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
              {[
                ["ステータス", caseRecord.status],
                ["優先度", caseRecord.priority],
                ["タイプ", caseRecord.type],
                ["問い合わせ経路", caseRecord.origin],
                ["作成日", new Date(caseRecord.createdAt).toLocaleDateString("ja-JP")],
                ["解決日", caseRecord.resolvedAt ? new Date(caseRecord.resolvedAt).toLocaleDateString("ja-JP") : null],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-2xs text-sf-weak">{label}</p>
                  <p className="text-sf-text">{value ?? "—"}</p>
                </div>
              ))}
            </div>
            {caseRecord.description && (
              <div>
                <p className="text-2xs text-sf-weak mb-1">説明</p>
                <p className="text-sm text-sf-text whitespace-pre-wrap">{caseRecord.description}</p>
              </div>
            )}
            {caseRecord.resolution && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-2xs text-green-700 mb-1 font-semibold">解決内容</p>
                <p className="text-sm text-sf-text whitespace-pre-wrap">{caseRecord.resolution}</p>
              </div>
            )}
          </div>

          {caseRecord.tasks.length > 0 && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
              <h2 className="text-sm font-semibold text-sf-text mb-4">タスク ({caseRecord.tasks.length})</h2>
              <div className="space-y-2">
                {caseRecord.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 text-sm py-1">
                    <span className={`w-2 h-2 rounded-full ${t.status === "done" ? "bg-success" : "bg-warning"}`} />
                    <span className="text-sf-text flex-1">{t.title}</span>
                    {t.dueDate && <span className="text-2xs text-sf-weak">{new Date(t.dueDate).toLocaleDateString("ja-JP")}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {caseRecord.company && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
              <h3 className="text-xs font-semibold text-sf-weak mb-2">会社</h3>
              <Link href={`/companies/${caseRecord.company.id}`} className="text-sm text-primary-600 hover:underline">
                {caseRecord.company.companyName}
              </Link>
            </div>
          )}
          {caseRecord.contact && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
              <h3 className="text-xs font-semibold text-sf-weak mb-2">コンタクト</h3>
              <Link href={`/contacts/${caseRecord.contact.id}`} className="text-sm text-primary-600 hover:underline">
                {caseRecord.contact.fullName}
              </Link>
              {caseRecord.contact.email && <p className="text-2xs text-sf-weak">{caseRecord.contact.email}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
