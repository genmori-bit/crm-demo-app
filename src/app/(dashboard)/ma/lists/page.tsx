"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface MarketingList {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  updatedAt: string;
  _count: { memberships: number };
}

export default function ListsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [lists, setLists] = useState<MarketingList[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/lists").then((r) => r.json()).then((data) => { setLists(data); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/ma/lists/${id}`, { method: "DELETE" });
    showToast("削除しました", "success");
    load();
  };

  const filtered = search
    ? lists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : lists;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">リスト</h1>
            <p className="text-xs text-sf-weak mt-0.5">リードのセグメントリスト</p>
          </div>
          <button
            onClick={() => router.push("/ma/lists/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規リスト
          </button>
        </div>
      </div>

      <ListViewToolbar
        total={filtered.length}
        objectLabel="リスト"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={load}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">リスト名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-24">種類</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">メンバー数</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">公開設定</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">更新日</th>
              <th className="px-4 py-2.5 w-16" />
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState
                    title="リストがありません"
                    description={search ? "検索条件に一致するリストがありません" : "リードを整理するリストを作成しましょう"}
                    action={!search ? { label: "新規リスト", onClick: () => router.push("/ma/lists/new") } : undefined}
                  />
                </td>
              </tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="hover:bg-sf-bg transition-colors group">
                <td className="px-4 py-3">
                  <Link href={`/ma/lists/${l.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                    {l.name}
                  </Link>
                  {l.description && (
                    <p className="text-2xs text-sf-weak truncate max-w-xs mt-0.5">{l.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium ${l.type === "static" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {l.type === "static" ? "静的" : "動的"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold tabular-nums text-sf-text">{l._count.memberships.toLocaleString()}人</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-2xs font-medium ${l.isPublic ? "text-success" : "text-sf-weak"}`}>
                    {l.isPublic ? "公開" : "非公開"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xs text-sf-weak tabular-nums">
                    {new Date(l.updatedAt).toLocaleDateString("ja-JP")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(l.id, l.name)}
                    className="text-2xs text-danger hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
