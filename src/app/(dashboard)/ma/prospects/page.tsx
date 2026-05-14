"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";

interface Prospect {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  score: number;
  grade: string;
  status: string;
  doNotEmail: boolean;
  optedOut: boolean;
  createdAt: string;
}

interface Result {
  prospects: Prospect[];
  total: number;
  page: number;
  totalPages: number;
}

const GRADE_STYLE: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border-green-200",
  A: "bg-green-100 text-green-700 border-green-200",
  B: "bg-blue-100 text-blue-700 border-blue-200",
  C: "bg-yellow-100 text-yellow-700 border-yellow-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
  F: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "アクティブ",
  paused: "一時停止",
  blacklisted: "ブラックリスト",
  converted: "コンバート済み",
};

function ProspectStatusBadge({ prospect }: { prospect: Prospect }) {
  if (prospect.optedOut) {
    return <span className="inline-flex items-center gap-1 text-2xs font-medium text-danger"><span className="w-1.5 h-1.5 rounded-full bg-danger" />オプトアウト</span>;
  }
  if (prospect.doNotEmail) {
    return <span className="inline-flex items-center gap-1 text-2xs font-medium text-warning"><span className="w-1.5 h-1.5 rounded-full bg-warning" />メール停止</span>;
  }
  const isActive = prospect.status === "active";
  const isConverted = prospect.status === "converted";
  return (
    <span className={`inline-flex items-center gap-1 text-2xs font-medium ${isActive ? "text-success" : isConverted ? "text-primary-600" : "text-sf-weak"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : isConverted ? "bg-primary-500" : "bg-sf-weak"}`} />
      {STATUS_LABELS[prospect.status] ?? prospect.status}
    </span>
  );
}

export default function ProspectsPage() {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const data = await fetch(`/api/ma/prospects?${params}`).then((r) => r.json());
    setResult(data);
    setLoading(false);
  }, [search, status]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">プロスペクト</h1>
            <p className="text-xs text-sf-weak mt-0.5">マーケティング対象の見込み顧客</p>
          </div>
          <button
            onClick={() => router.push("/ma/prospects/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規プロスペクト
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <ListViewToolbar
        total={result?.total}
        objectLabel="プロスペクト"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={() => load(1)}
        filters={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-sf border border-sf-border bg-white px-2 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="">全ステータス</option>
            <option value="active">アクティブ</option>
            <option value="paused">一時停止</option>
            <option value="converted">コンバート済み</option>
            <option value="blacklisted">ブラックリスト</option>
          </select>
        }
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">メール / 氏名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">会社 / 役職</th>
              <th className="text-center px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">スコア</th>
              <th className="text-center px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">グレード</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-32">ステータス</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">作成日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border bg-sf-surface">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-sf-weak">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    読み込み中...
                  </div>
                </td>
              </tr>
            ) : result?.prospects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState
                    title="プロスペクトがありません"
                    description={search || status ? "検索条件に一致するプロスペクトが見つかりません" : "最初のプロスペクトを追加してマーケティングを開始しましょう"}
                    action={!search && !status ? {
                      label: "新規プロスペクト",
                      onClick: () => router.push("/ma/prospects/new"),
                    } : undefined}
                  />
                </td>
              </tr>
            ) : result?.prospects.map((p) => (
              <tr key={p.id} className="hover:bg-sf-bg transition-colors group">
                <td className="px-4 py-3">
                  <Link href={`/ma/prospects/${p.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                    {p.email}
                  </Link>
                  {(p.firstName || p.lastName) && (
                    <p className="text-2xs text-sf-weak mt-0.5">{[p.firstName, p.lastName].filter(Boolean).join(" ")}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.companyName ? (
                    <>
                      <p className="text-xs text-sf-text">{p.companyName}</p>
                      {p.jobTitle && <p className="text-2xs text-sf-weak mt-0.5">{p.jobTitle}</p>}
                    </>
                  ) : (
                    <span className="text-2xs text-sf-placeholder">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-bold tabular-nums text-sf-text">{p.score}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded border text-2xs font-bold ${GRADE_STYLE[p.grade] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {p.grade}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProspectStatusBadge prospect={p} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xs text-sf-weak tabular-nums">
                    {new Date(p.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="bg-sf-surface border-t border-sf-border px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-sf-weak">
            {result.total.toLocaleString("ja-JP")}件中 {(result.page - 1) * 50 + 1}–{Math.min(result.page * 50, result.total)}件
          </span>
          <div className="flex gap-1">
            <button
              disabled={result.page <= 1}
              onClick={() => load(result.page - 1)}
              className="h-7 px-3 text-xs rounded-sf border border-sf-border text-sf-text hover:bg-sf-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>
            <button
              disabled={result.page >= result.totalPages}
              onClick={() => load(result.page + 1)}
              className="h-7 px-3 text-xs rounded-sf border border-sf-border text-sf-text hover:bg-sf-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
