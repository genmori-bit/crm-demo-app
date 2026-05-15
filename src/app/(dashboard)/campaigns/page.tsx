"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRow } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  type: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  _count: { members: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "muted" | "success" | "info" | "danger" }> = {
  Planning:  { label: "計画中", variant: "muted" },
  Active:    { label: "実施中", variant: "success" },
  Completed: { label: "完了",   variant: "info" },
  Aborted:   { label: "中止",   variant: "danger" },
};

const LIST_VIEWS = [
  { id: "all",       label: "すべて",  status: "" },
  { id: "active",    label: "実施中",  status: "Active" },
  { id: "planning",  label: "計画中",  status: "Planning" },
  { id: "completed", label: "完了",    status: "Completed" },
];

function CampaignsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [activeView, setActiveView] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const statusFilter = LIST_VIEWS.find((v) => v.id === activeView)?.status ?? "";

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/campaigns?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  }, [q, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">マーケティング</p>
            <h1 className="text-xl font-bold text-sf-text">キャンペーン</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/campaigns/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規キャンペーン
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
            placeholder="キャンペーン名を検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            aria-label="キャンペーンを検索"
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
              <th className="text-left px-6 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">キャンペーン名</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">タイプ</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">ステータス</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">開始日</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">終了日</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">メンバー数</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">予算</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="キャンペーンが見つかりません"
                    description="新規キャンペーンを作成してください"
                    action={<Button onClick={() => router.push("/campaigns/new")}>新規キャンペーン作成</Button>}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            ) : campaigns.map((c) => {
              const statusInfo = STATUS_MAP[c.status];
              return (
                <tr
                  key={c.id}
                  className="border-b border-sf-border/60 hover:bg-info-light/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/campaigns/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary-600 hover:underline hover:text-primary-700"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-weak">{c.type ?? "—"}</td>
                  <td className="px-4 py-3">
                    {statusInfo
                      ? <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                      : <Badge variant="muted">{c.status}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-weak tabular-nums">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString("ja-JP") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-weak tabular-nums">
                    {c.endDate ? new Date(c.endDate).toLocaleDateString("ja-JP") : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-sf-text">
                    {c._count.members.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-text tabular-nums">
                    {c.budget != null ? `¥${c.budget.toLocaleString()}` : "—"}
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

export default function CampaignsPage() {
  return <Suspense><CampaignsInner /></Suspense>;
}
