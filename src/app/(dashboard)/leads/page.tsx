"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Lead {
  id: string;
  fullName: string;
  email: string | null;
  companyName: string | null;
  title: string | null;
  status: string;
  rating: string;
  source: string | null;
  score: number | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  WORKING: "bg-yellow-100 text-yellow-700",
  NURTURING: "bg-purple-100 text-purple-700",
  CONVERTED: "bg-green-100 text-green-700",
  DISQUALIFIED: "bg-gray-100 text-gray-500",
};

const RATING_COLORS: Record<string, string> = {
  HOT: "bg-red-100 text-red-700",
  WARM: "bg-orange-100 text-orange-700",
  COLD: "bg-blue-100 text-blue-600",
};

export default function LeadsPage() {
  const showToast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [q, status, page]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">CRM</p>
        <h1 className="text-xl font-bold text-sf-text">リード</h1>
        <p className="text-xs text-sf-weak mt-0.5">見込みの問い合わせ・潜在顧客を管理します</p>
      </div>

      <div className="px-6 py-4 bg-sf-surface border-b border-sf-border flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="名前・会社名・メールで検索..."
          className="border border-sf-border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select
          className="border border-sf-border rounded px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">ステータス: すべて</option>
          <option value="NEW">新規</option>
          <option value="WORKING">対応中</option>
          <option value="NURTURING">育成中</option>
          <option value="CONVERTED">変換済み</option>
          <option value="DISQUALIFIED">失格</option>
        </select>
        <div className="ml-auto">
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規リード
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-sf-border bg-sf-bg sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">氏名</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">会社</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">役職</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">評価</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">スコア</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ソース</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border bg-sf-surface">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="text-primary-600 hover:underline font-medium">
                        {lead.fullName}
                      </Link>
                      {lead.email && <p className="text-2xs text-sf-weak">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sf-text">{lead.companyName ?? "—"}</td>
                    <td className="px-4 py-3 text-sf-text">{lead.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium ${RATING_COLORS[lead.rating] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sf-text">{lead.score ?? "—"}</td>
                    <td className="px-4 py-3 text-sf-weak">{lead.source ?? "—"}</td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-sf-weak">リードがありません</td></tr>
                )}
              </tbody>
            </table>
            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-sf-border bg-sf-surface text-xs text-sf-weak">
                <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}件</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-sf-border disabled:opacity-40">前</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-2 py-1 rounded border border-sf-border disabled:opacity-40">次</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
