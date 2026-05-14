"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  status: string;
  priority: string;
  origin: string | null;
  type: string | null;
  createdAt: string;
  company: { id: string; companyName: string } | null;
  contact: { id: string; fullName: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Open: "bg-yellow-100 text-yellow-700",
  "Pending Customer": "bg-orange-100 text-orange-700",
  "Pending Internal": "bg-purple-100 text-purple-700",
  Escalated: "bg-red-100 text-red-700",
  Closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "text-red-600",
  High: "text-orange-600",
  Medium: "text-yellow-600",
  Low: "text-sf-weak",
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [q, status]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">サポート</p>
        <h1 className="text-xl font-bold text-sf-text">ケース</h1>
        <p className="text-xs text-sf-weak mt-0.5">顧客サポートケースの管理</p>
      </div>

      <div className="px-6 py-4 bg-sf-surface border-b border-sf-border flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="件名で検索..."
          className="border border-sf-border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border border-sf-border rounded px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">ステータス: すべて</option>
          <option value="New">新規</option>
          <option value="Open">対応中</option>
          <option value="Pending Customer">顧客待ち</option>
          <option value="Escalated">エスカレート</option>
          <option value="Closed">クローズ</option>
        </select>
        <div className="ml-auto">
          <Link href="/cases/new" className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規ケース
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sf-border bg-sf-bg sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">番号</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">件名</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">会社</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">優先度</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">タイプ</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">作成日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-sf-bg transition-colors">
                  <td className="px-4 py-3 text-sf-weak font-mono text-xs">{c.caseNumber}</td>
                  <td className="px-4 py-3">
                    <Link href={`/cases/${c.id}`} className="text-primary-600 hover:underline font-medium">{c.subject}</Link>
                  </td>
                  <td className="px-4 py-3 text-sf-text">
                    {c.company ? (
                      <Link href={`/companies/${c.company.id}`} className="hover:underline">{c.company.companyName}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${PRIORITY_COLORS[c.priority] ?? "text-sf-text"}`}>{c.priority}</td>
                  <td className="px-4 py-3 text-sf-weak">{c.type ?? "—"}</td>
                  <td className="px-4 py-3 text-sf-weak">{new Date(c.createdAt).toLocaleDateString("ja-JP")}</td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-sf-weak">ケースがありません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
