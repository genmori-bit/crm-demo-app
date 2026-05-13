"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Prospect {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
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

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-gray-100 text-gray-600",
  F: "bg-red-100 text-red-700",
};

export default function ProspectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
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

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">プロスペクト</h1>
          <p className="text-sm text-sf-weak">{result?.total ?? "—"} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/prospects/new")}>新規プロスペクト</Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-3 items-end">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="メール、氏名、会社で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text"
        >
          <option value="">全ステータス</option>
          <option value="active">アクティブ</option>
          <option value="paused">一時停止</option>
          <option value="blacklisted">ブラックリスト</option>
        </select>
        <Button type="submit" variant="secondary">検索</Button>
      </form>

      {/* Table */}
      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">メール / 氏名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">会社</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">スコア</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">グレード</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ステータス</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">作成日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : result?.prospects.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">プロスペクトがありません</td></tr>
            ) : result?.prospects.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/ma/prospects/${p.id}`} className="font-medium text-primary-600 hover:underline block">
                    {p.email}
                  </Link>
                  {(p.firstName || p.lastName) && (
                    <div className="text-xs text-sf-weak">{[p.firstName, p.lastName].filter(Boolean).join(" ")}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sf-text">{p.company ?? "—"}</td>
                <td className="px-4 py-3 text-center font-semibold text-sf-text">{p.score}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[p.grade] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.grade}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.optedOut ? (
                    <span className="text-xs text-red-600">オプトアウト</span>
                  ) : p.doNotEmail ? (
                    <span className="text-xs text-orange-600">メール停止</span>
                  ) : (
                    <span className={`text-xs ${p.status === "active" ? "text-green-600" : "text-sf-weak"}`}>
                      {p.status === "active" ? "アクティブ" : p.status === "paused" ? "一時停止" : p.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sf-weak text-xs">{new Date(p.createdAt).toLocaleDateString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-sf-weak">{result.total} 件中 {(result.page - 1) * 50 + 1}–{Math.min(result.page * 50, result.total)} 件</span>
          <div className="flex gap-2">
            {result.page > 1 && <Button variant="secondary" onClick={() => load(result.page - 1)}>前へ</Button>}
            {result.page < result.totalPages && <Button variant="secondary" onClick={() => load(result.page + 1)}>次へ</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
