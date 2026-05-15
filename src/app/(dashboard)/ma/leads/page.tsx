"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Lead {
  id: string;
  fullName: string;
  email: string | null;
  companyName: string | null;
  title: string | null;
  status: string;
  lifecycleStage: string | null;
  score: number | null;
  grade: string | null;
  doNotEmail: boolean;
  optedOut: boolean;
  consentStatus: string;
  source: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  VISITOR: "bg-gray-100 text-gray-600",
  LEAD: "bg-blue-100 text-blue-700",
  MQL: "bg-purple-100 text-purple-700",
  SQL: "bg-yellow-100 text-yellow-700",
  OPPORTUNITY: "bg-orange-100 text-orange-700",
  CUSTOMER: "bg-green-100 text-green-700",
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-gray-100 text-gray-600",
  F: "bg-red-100 text-red-700",
};

function MALeadsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [stage, setStage] = useState(searchParams.get("stage") ?? "");
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (stage) params.set("lifecycleStage", stage);
    // MA filter: exclude converted
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [q, status, stage, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">マーケティング</p>
        <h1 className="text-xl font-bold text-sf-text">リード</h1>
        <p className="text-xs text-sf-weak mt-0.5">CRM/MA共通のリード管理。スコア・グレード・エンゲージメントを確認できます。</p>
      </div>

      <div className="px-6 py-4 bg-sf-surface border-b border-sf-border flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="氏名・会社名・メールで検索..."
          className="border border-sf-border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select
          className="border border-sf-border rounded px-3 py-1.5 text-sm"
          value={stage}
          onChange={(e) => { setStage(e.target.value); setPage(1); }}
        >
          <option value="">全ステージ</option>
          {["VISITOR","LEAD","MQL","SQL","OPPORTUNITY","CUSTOMER"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-sf-weak">{total} 件</span>
          <Link
            href="/ma/leads/new"
            className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700"
          >
            新規リード
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sf-text font-medium mb-1">リードがありません</p>
            <p className="text-xs text-sf-weak mb-4">フォーム送信やインポートでリードを作成できます</p>
            <Link href="/ma/leads/new" className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-700">
              新規リードを作成
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-sf-bg border-b border-sf-border sticky top-0">
              <tr>
                <th className="text-left px-6 py-2.5 text-2xs font-semibold text-sf-weak">氏名</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">会社名</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">ステージ</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">スコア</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">グレード</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">同意</th>
                <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">最終活動</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-sf-bg cursor-pointer"
                  onClick={() => router.push(`/ma/leads/${lead.id}`)}
                >
                  <td className="px-6 py-2.5">
                    <div>
                      <p className="font-medium text-primary-600 hover:underline">{lead.fullName}</p>
                      {lead.email && <p className="text-2xs text-sf-weak">{lead.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sf-text">{lead.companyName ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {lead.lifecycleStage ? (
                      <span className={`text-2xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[lead.lifecycleStage] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.lifecycleStage}
                      </span>
                    ) : <span className="text-sf-weak">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-sf-text">{lead.score ?? 0}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {lead.grade ? (
                      <span className={`text-2xs px-1.5 py-0.5 rounded font-bold ${GRADE_COLORS[lead.grade] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.grade}
                      </span>
                    ) : <span className="text-sf-weak">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {lead.optedOut ? (
                      <span className="text-2xs text-red-600">オプトアウト</span>
                    ) : lead.doNotEmail ? (
                      <span className="text-2xs text-yellow-600">配信停止</span>
                    ) : (
                      <span className="text-2xs text-green-600">配信可</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-2xs text-sf-weak">
                    {lead.lastActivityAt
                      ? new Date(lead.lastActivityAt).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > limit && (
          <div className="px-6 py-3 border-t border-sf-border flex items-center justify-between text-xs text-sf-weak bg-sf-surface">
            <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border border-sf-border rounded disabled:opacity-40">前へ</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="px-2 py-1 border border-sf-border rounded disabled:opacity-40">次へ</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MALeadsPage() {
  return <Suspense><MALeadsInner /></Suspense>;
}
