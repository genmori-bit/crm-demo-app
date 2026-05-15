"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRow } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

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

const STAGE_MAP: Record<string, { label: string; variant: "brand" | "purple" | "warning" | "info" | "success" | "muted" }> = {
  VISITOR:     { label: "Visitor",     variant: "muted" },
  LEAD:        { label: "Lead",        variant: "brand" },
  MQL:         { label: "MQL",         variant: "purple" },
  SQL:         { label: "SQL",         variant: "warning" },
  OPPORTUNITY: { label: "Opportunity", variant: "info" },
  CUSTOMER:    { label: "Customer",    variant: "success" },
};

const GRADE_MAP: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border border-green-200",
  A:    "bg-green-100 text-green-700 border border-green-200",
  B:    "bg-blue-100 text-blue-700 border border-blue-200",
  C:    "bg-yellow-100 text-yellow-700 border border-yellow-200",
  D:    "bg-gray-100 text-gray-500 border border-gray-200",
  F:    "bg-red-100 text-red-700 border border-red-200",
};

function ScoreBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const pct = Math.min(s, 100);
  const color = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : pct >= 30 ? "bg-primary-400" : "bg-sf-border-strong";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-sf-bg rounded-full overflow-hidden border border-sf-border">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-sf-text w-6 text-right">{s}</span>
    </div>
  );
}

const LIST_VIEWS = [
  { id: "all", label: "すべて", stage: "" },
  { id: "mql", label: "MQL", stage: "MQL" },
  { id: "sql", label: "SQL", stage: "SQL" },
  { id: "opp", label: "Opportunity", stage: "OPPORTUNITY" },
];

function MALeadsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [activeView, setActiveView] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const stage = LIST_VIEWS.find((v) => v.id === activeView)?.stage ?? "";

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (stage) params.set("lifecycleStage", stage);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [q, stage, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">MA</p>
            <h1 className="text-xl font-bold text-sf-text">リード</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/ma/leads/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規リード
        </Button>
      </div>

      {/* View tabs */}
      <div className="bg-sf-surface border-b border-sf-border px-6 overflow-x-auto">
        <nav className="flex" role="tablist" aria-label="ビュー">
          {LIST_VIEWS.map((view) => (
            <button
              key={view.id}
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => { setActiveView(view.id); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none",
                activeView === view.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              )}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-sf-weak shrink-0 tabular-nums">
          {loading ? "読み込み中..." : `${total.toLocaleString()} 件`}
        </span>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="氏名・会社・メールで検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            aria-label="リードを検索"
          />
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-sf text-sf-weak hover:bg-sf-bg border border-sf-border transition-colors ml-auto"
          aria-label="更新"
          title="更新"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-sf-surface">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="bg-sf-bg border-b border-sf-border sticky top-0 z-10">
              <th className="text-left px-6 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">氏名 / メール</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">会社名・役職</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">ステージ</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">スコア</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">グレード</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">配信</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">最終活動</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="リードが見つかりません"
                    description="検索条件を変えるか、新規リードを作成してください"
                    action={<Button onClick={() => router.push("/ma/leads/new")}>新規リード作成</Button>}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            ) : leads.map((lead) => {
              const stageInfo = lead.lifecycleStage ? STAGE_MAP[lead.lifecycleStage] : null;
              return (
                <tr
                  key={lead.id}
                  className="border-b border-sf-border/60 hover:bg-info-light/30 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/ma/leads/${lead.id}`)}
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/ma/leads/${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary-600 hover:underline hover:text-primary-700 leading-tight block"
                    >
                      {lead.fullName}
                    </Link>
                    {lead.email && <p className="text-xs text-sf-weak mt-0.5 leading-none">{lead.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.companyName ? (
                      <>
                        <p className="text-sm text-sf-text">{lead.companyName}</p>
                        {lead.title && <p className="text-xs text-sf-weak mt-0.5">{lead.title}</p>}
                      </>
                    ) : <span className="text-sf-weak">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {stageInfo ? (
                      <Badge variant={stageInfo.variant} dot>{stageInfo.label}</Badge>
                    ) : <span className="text-sf-weak text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={lead.score} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.grade ? (
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold", GRADE_MAP[lead.grade] ?? "bg-gray-100 text-gray-600")}>
                        {lead.grade}
                      </span>
                    ) : <span className="text-sf-weak text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.optedOut ? (
                      <span className="inline-flex items-center gap-1 text-xs text-danger font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger" />オプトアウト
                      </span>
                    ) : lead.doNotEmail ? (
                      <span className="inline-flex items-center gap-1 text-xs text-warning font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning" />配信停止
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />配信可
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-weak">
                    {lead.lastActivityAt
                      ? new Date(lead.lastActivityAt).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-2.5 border-t border-sf-border bg-sf-bg flex items-center justify-between">
          <p className="text-xs text-sf-weak tabular-nums">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total.toLocaleString()} 件
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 px-3 text-xs rounded-sf border border-sf-border bg-white hover:bg-sf-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>
            <span className="text-xs text-sf-weak px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-7 px-3 text-xs rounded-sf border border-sf-border bg-white hover:bg-sf-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MALeadsPage() {
  return <Suspense><MALeadsInner /></Suspense>;
}
