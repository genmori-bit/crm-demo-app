"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LightningCard } from "@/components/ui/lightning-card";
import { CompanyStatusBadge } from "@/components/ui/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  companyName: string;
  industry: string | null;
  status: string;
  ownerName: string | null;
  createdAt: string;
  _count: { contacts: number; deals: number };
}

const INDUSTRIES = ["IT・ソフトウェア", "商社・卸売", "医療・ヘルスケア", "飲食・食品", "製造・メーカー", "金融・保険", "不動産", "サービス", "その他"];

type ViewId = "all" | "active" | "prospect" | "negotiating" | "dormant";

const LIST_VIEWS: { id: ViewId; label: string; statusFilter: string }[] = [
  { id: "all", label: "すべての企業", statusFilter: "" },
  { id: "active", label: "既存顧客", statusFilter: "active" },
  { id: "prospect", label: "見込み", statusFilter: "prospect" },
  { id: "negotiating", label: "商談中", statusFilter: "negotiating" },
  { id: "dormant", label: "休眠", statusFilter: "dormant" },
];

type SortField = "companyName" | "createdAt" | "status";

export default function CompaniesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [activeView, setActiveView] = useState<ViewId>("all");
  const [sortField, setSortField] = useState<SortField>("companyName");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const viewDef = LIST_VIEWS.find((v) => v.id === activeView)!;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (viewDef.statusFilter) params.set("status", viewDef.statusFilter);
    if (industry) params.set("industry", industry);
    const data = await api.get<Company[]>(`/api/companies?${params}`);
    setCompanies(data);
    setSelected(new Set());
    setLoading(false);
  }, [query, viewDef.statusFilter, industry]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/companies/${deleteId}`);
      showToast("顧客企業を削除しました");
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

  const sorted = [...companies].sort((a, b) => {
    let cmp = 0;
    if (sortField === "companyName") cmp = a.companyName.localeCompare(b.companyName, "ja");
    else if (sortField === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
    else if (sortField === "status") cmp = a.status.localeCompare(b.status);
    return sortAsc ? cmp : -cmp;
  });

  const allSelected = sorted.length > 0 && sorted.every((c) => selected.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((c) => c.id)));
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={cn("w-3 h-3 ml-1 inline-block transition-transform", sortField === field ? "text-primary-500" : "text-sf-border", sortField === field && !sortAsc ? "rotate-180" : "")}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">顧客企業</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/companies/new")}>
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
          {/* ── Toolbar ──────────────────────────────── */}
          <div className="px-4 py-2.5 border-b border-sf-border bg-sf-surface flex items-center gap-2 flex-wrap">
            {/* Count */}
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
                  placeholder="会社名・担当者で検索..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                  aria-label="顧客企業を検索"
                />
              </div>

              {/* Industry filter */}
              <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-8 text-xs w-36">
                <option value="">業界: すべて</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
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
              <Button size="sm" onClick={() => router.push("/companies/new")}>
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
              title="顧客企業が見つかりません"
              description="検索条件を変更するか、新しい顧客企業を登録してください"
              action={<Button onClick={() => router.push("/companies/new")}>新規作成</Button>}
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
                        onClick={() => toggleSort("companyName")}
                      >
                        会社名 <SortIcon field="companyName" />
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">業界</th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("status")}
                      >
                        ステータス <SortIcon field="status" />
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">担当者</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">連絡先</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">商談</th>
                      <th
                        className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak cursor-pointer select-none hover:text-sf-text"
                        onClick={() => toggleSort("createdAt")}
                      >
                        登録日 <SortIcon field="createdAt" />
                      </th>
                      <th className="px-4 py-2.5 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sf-border">
                    {sorted.map((c) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "transition-colors group",
                          selected.has(c.id) ? "bg-primary-50" : "hover:bg-sf-bg"
                        )}
                      >
                        <td className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selected.has(c.id)}
                            onChange={() => {
                              const next = new Set(selected);
                              if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                              setSelected(next);
                            }}
                            className="w-3.5 h-3.5 rounded border-sf-border text-primary-500 focus:ring-primary-200"
                            aria-label={`${c.companyName}を選択`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/companies/${c.id}`}
                            className="font-semibold text-primary-500 hover:underline"
                          >
                            {c.companyName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sf-text text-xs">{c.industry ?? "-"}</td>
                        <td className="px-4 py-3">
                          <CompanyStatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-sf-text text-xs">{c.ownerName ?? "-"}</td>
                        <td className="px-4 py-3 text-sf-weak text-xs">{c._count.contacts}名</td>
                        <td className="px-4 py-3 text-sf-weak text-xs">{c._count.deals}件</td>
                        <td className="px-4 py-3 text-sf-weak text-xs">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/companies/${c.id}/edit`)}
                              className="text-xs text-sf-weak hover:text-primary-500 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => setDeleteId(c.id)}
                              className="text-xs text-sf-weak hover:text-danger px-2 py-1 rounded hover:bg-danger-light transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
              </div>
            </>
          )}
        </LightningCard>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="顧客企業の削除"
        message="この顧客企業を削除しますか？関連する担当者・商談データも削除されます。"
        loading={deleting}
      />
    </div>
  );
}
