"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LightningCard } from "@/components/ui/lightning-card";
import { DealStageBadge } from "@/components/ui/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, formatAmount, isOverdue } from "@/lib/utils";
import { DEAL_STAGE_LABELS, type DealStage } from "@/types";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  dealName: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  company: { id: string; companyName: string };
  contact: { fullName: string } | null;
}

type ViewId = "all" | "active" | "won" | "lost";

const LIST_VIEWS: { id: ViewId; label: string; stageFilter: string }[] = [
  { id: "all", label: "すべての商談", stageFilter: "" },
  { id: "active", label: "進行中", stageFilter: "active" },
  { id: "won", label: "受注済み", stageFilter: "won" },
  { id: "lost", label: "失注", stageFilter: "lost" },
];

const ACTIVE_STAGES: DealStage[] = ["lead", "hearing", "proposal", "negotiation"];

type SortField = "dealName" | "amount" | "probability" | "expectedCloseDate" | "stage";

const STAGE_ORDER: Record<string, number> = {
  lead: 0, hearing: 1, proposal: 2, negotiation: 3, won: 4, lost: 5,
};

function ProbabilityBar({ value }: { value: number }) {
  const color =
    value >= 75 ? "#2e844a" :
    value >= 50 ? "#0176d3" :
    value >= 25 ? "#dd7a01" :
    "#706e6b";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-sf-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-sf-text w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

function PipelineSummary({ deals }: { deals: Deal[] }) {
  const active = deals.filter((d) => ACTIVE_STAGES.includes(d.stage as DealStage));
  const totalAmount = active.reduce((s, d) => s + d.amount, 0);
  const totalWeighted = active.reduce((s, d) => s + Math.round((d.amount * d.probability) / 100), 0);

  const byStage = ACTIVE_STAGES.map((stage) => {
    const stageDeal = active.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeal.length,
      amount: stageDeal.reduce((s, d) => s + d.amount, 0),
    };
  });

  return (
    <div className="px-4 py-3 border-b border-sf-border bg-sf-bg/60 flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {byStage.map(({ stage, count, amount }) => (
          <div key={stage} className="flex items-center gap-1.5 text-xs">
            <span className="text-sf-weak">{DEAL_STAGE_LABELS[stage]}</span>
            <span className="font-semibold text-sf-text">{count}件</span>
            {amount > 0 && (
              <span className="text-sf-weak tabular-nums">({formatAmount(amount)})</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-2xs text-sf-weak uppercase tracking-wide">パイプライン総額</p>
          <p className="text-sm font-bold text-sf-text tabular-nums">{formatAmount(totalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xs text-sf-weak uppercase tracking-wide">受注見込み</p>
          <p className="text-sm font-bold text-success tabular-nums">{formatAmount(totalWeighted)}</p>
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<ViewId>("all");
  const [sortField, setSortField] = useState<SortField>("expectedCloseDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const viewDef = LIST_VIEWS.find((v) => v.id === activeView)!;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (viewDef.stageFilter === "active") {
      // active = all non-terminal stages — fetch all and filter client-side
    } else if (viewDef.stageFilter) {
      params.set("stage", viewDef.stageFilter);
    }
    const data = await api.get<Deal[]>(`/api/deals?${params}`);
    const filtered =
      viewDef.stageFilter === "active"
        ? data.filter((d) => ACTIVE_STAGES.includes(d.stage as DealStage))
        : data;
    setDeals(filtered);
    setSelected(new Set());
    setLoading(false);
  }, [query, viewDef.stageFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/deals/${deleteId}`);
      showToast("商談を削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const sorted = [...deals].sort((a, b) => {
    let cmp = 0;
    if (sortField === "dealName") cmp = a.dealName.localeCompare(b.dealName, "ja");
    else if (sortField === "amount") cmp = a.amount - b.amount;
    else if (sortField === "probability") cmp = a.probability - b.probability;
    else if (sortField === "stage") cmp = (STAGE_ORDER[a.stage] ?? 0) - (STAGE_ORDER[b.stage] ?? 0);
    else if (sortField === "expectedCloseDate") {
      const da = a.expectedCloseDate ?? "9999-99-99";
      const db = b.expectedCloseDate ?? "9999-99-99";
      cmp = da.localeCompare(db);
    }
    return sortAsc ? cmp : -cmp;
  });

  const allSelected = sorted.length > 0 && sorted.every((d) => selected.has(d.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((d) => d.id)));
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={cn(
        "w-3 h-3 ml-1 inline-block transition-transform",
        sortField === field ? "text-primary-500" : "text-sf-border",
        sortField === field && !sortAsc ? "rotate-180" : ""
      )}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Object header ──────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-sf-text">商談</h1>
        </div>
        <Button onClick={() => router.push("/deals/new")}>
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Button>
      </div>

      {/* ── List view tabs ─────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 overflow-x-auto">
        <nav className="flex" role="tablist" aria-label="リストビュー">
          {LIST_VIEWS.map((view) => (
            <button
              key={view.id}
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none",
                activeView === view.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 flex-1">
        <LightningCard>
          {/* ── Pipeline summary ─────────────────────── */}
          {!loading && deals.length > 0 && activeView !== "won" && activeView !== "lost" && (
            <PipelineSummary deals={activeView === "active" ? sorted : deals} />
          )}

          {/* ── Toolbar ──────────────────────────────── */}
          <div className="px-4 py-2.5 border-b border-sf-border bg-sf-surface flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-sf-weak shrink-0">
              {loading ? "読み込み中..." : `${sorted.length}件`}
            </span>

            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="商談名・会社名で検索..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  aria-label="商談を検索"
                />
              </div>

              {/* Stage filter (only in "all" view) */}
              {activeView === "all" && (
                <Select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const matched = LIST_VIEWS.find((v) => v.stageFilter === e.target.value);
                      if (matched) setActiveView(matched.id);
                    }
                  }}
                  className="h-8 text-xs w-40"
                >
                  <option value="">ステージ: すべて</option>
                  {(Object.keys(DEAL_STAGE_LABELS) as DealStage[]).map((s) => (
                    <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>
                  ))}
                </Select>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={load}
                className="w-8 h-8 flex items-center justify-center rounded-sf text-sf-weak hover:bg-sf-bg border border-sf-border transition-colors"
                aria-label="更新"
                title="更新"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <Button size="sm" onClick={() => router.push("/deals/new")}>
                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規
              </Button>
            </div>
          </div>

          {/* ── Table ──────────────────────────────────── */}
          {loading ? (
            <PageLoading />
          ) : sorted.length === 0 ? (
            <EmptyState
              title="商談が見つかりません"
              description="検索条件を変更するか、新しい商談を登録してください"
              action={<Button onClick={() => router.push("/deals/new")}>新規作成</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="grid">
                  <thead>
                    <tr className="border-b border-sf-border bg-sf-bg">
                      <th className="w-10 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="w-3.5 h-3.5 rounded border-sf-border text-primary-500 focus:ring-primary-200"
                          aria-label="すべて選択"
                        />
                      </th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("dealName")}
                      >
                        商談名 <SortIcon field="dealName" />
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">顧客企業</th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("stage")}
                      >
                        ステージ <SortIcon field="stage" />
                      </th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("amount")}
                      >
                        金額 <SortIcon field="amount" />
                      </th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text min-w-[120px]"
                        onClick={() => toggleSort("probability")}
                      >
                        確度 <SortIcon field="probability" />
                      </th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("expectedCloseDate")}
                      >
                        クローズ予定 <SortIcon field="expectedCloseDate" />
                      </th>
                      <th className="px-4 py-2.5 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sf-border">
                    {sorted.map((d) => {
                      const overdue =
                        d.expectedCloseDate &&
                        isOverdue(d.expectedCloseDate) &&
                        d.stage !== "won" &&
                        d.stage !== "lost";
                      return (
                        <tr
                          key={d.id}
                          className={cn(
                            "transition-colors group",
                            selected.has(d.id) ? "bg-primary-50" : "hover:bg-sf-bg"
                          )}
                        >
                          <td className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={selected.has(d.id)}
                              onChange={() => {
                                const next = new Set(selected);
                                next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                                setSelected(next);
                              }}
                              className="w-3.5 h-3.5 rounded border-sf-border text-primary-500 focus:ring-primary-200"
                              aria-label={`${d.dealName}を選択`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/deals/${d.id}`}
                              className="font-semibold text-primary-500 hover:underline"
                            >
                              {d.dealName}
                            </Link>
                            {d.contact && (
                              <p className="text-xs text-sf-weak mt-0.5">{d.contact.fullName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/companies/${d.company.id}`}
                              className="text-xs text-sf-text hover:text-primary-500 hover:underline"
                            >
                              {d.company.companyName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <DealStageBadge stage={d.stage} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-sf-text tabular-nums text-sm">
                              {formatAmount(d.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ProbabilityBar value={d.probability} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "text-xs font-medium tabular-nums",
                                overdue ? "text-danger font-semibold" : "text-sf-weak"
                              )}
                            >
                              {formatDate(d.expectedCloseDate) || "-"}
                              {overdue && (
                                <span className="ml-1 text-2xs bg-danger/10 text-danger px-1 py-0.5 rounded">期限超過</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => router.push(`/deals/${d.id}/edit`)}
                                className="text-xs text-sf-weak hover:text-primary-500 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => setDeleteId(d.id)}
                                className="text-xs text-sf-weak hover:text-danger px-2 py-1 rounded hover:bg-danger-light transition-colors"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-sf-border bg-sf-bg/50 flex items-center justify-between">
                <p className="text-xs text-sf-weak">
                  {sorted.length}件を表示
                  {selected.size > 0 && (
                    <span className="ml-2 text-primary-600 font-medium">{selected.size}件選択中</span>
                  )}
                </p>
                {selected.size > 0 && (
                  <p className="text-xs text-sf-weak tabular-nums">
                    選択中の合計:{" "}
                    <span className="font-bold text-sf-text">
                      {formatAmount(sorted.filter((d) => selected.has(d.id)).reduce((s, d) => s + d.amount, 0))}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}
        </LightningCard>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="商談の削除"
        message="この商談を削除しますか？関連する活動履歴・タスクの商談紐付けが解除されます。"
        loading={deleting}
      />
    </div>
  );
}
