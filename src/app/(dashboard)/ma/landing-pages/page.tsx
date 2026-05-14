"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface LandingPage {
  id: string;
  name: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "下書き", dot: "bg-sf-weak", text: "text-sf-weak" },
  published: { label: "公開中", dot: "bg-success", text: "text-success" },
  archived: { label: "アーカイブ", dot: "bg-orange-400", text: "text-orange-600" },
};

export default function LandingPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/landing-pages").then((r) => r.json()).then((data) => { setPages(data); setLoading(false); });
  };

  useEffect(load, []);

  const filtered = search
    ? pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase()))
    : pages;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">ランディングページ</h1>
            <p className="text-xs text-sf-weak mt-0.5">マーケティング用ランディングページの管理</p>
          </div>
          <button
            onClick={() => router.push("/ma/landing-pages/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規ページ
          </button>
        </div>
      </div>

      <ListViewToolbar
        total={filtered.length}
        objectLabel="ランディングページ"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={load}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ページ名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-40">URL スラッグ</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">ステータス</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-24">表示数</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">更新日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border bg-sf-surface">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm text-sf-weak">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    読み込み中...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16">
                  <EmptyState
                    title="ランディングページがありません"
                    description={search ? "検索条件に一致するページがありません" : "最初のランディングページを作成しましょう"}
                    action={!search ? { label: "新規ページ", onClick: () => router.push("/ma/landing-pages/new") } : undefined}
                  />
                </td>
              </tr>
            ) : filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, dot: "bg-sf-weak", text: "text-sf-weak" };
              return (
                <tr key={p.id} className="hover:bg-sf-bg transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/ma/landing-pages/${p.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                      {p.name}
                    </Link>
                    <p className="text-2xs text-sf-weak mt-0.5 truncate max-w-xs">{p.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-2xs font-mono text-sf-text bg-sf-bg border border-sf-border px-1.5 py-0.5 rounded">/{p.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-2xs font-medium", cfg.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-bold tabular-nums text-sf-text">{p.views.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-2xs text-sf-weak tabular-nums">{new Date(p.updatedAt).toLocaleDateString("ja-JP")}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
