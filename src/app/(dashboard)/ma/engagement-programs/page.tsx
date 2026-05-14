"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  _count?: { enrollments: number; nodes: number };
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; card: string }> = {
  draft: { label: "下書き", dot: "bg-sf-weak", text: "text-sf-weak", card: "border-sf-border" },
  active: { label: "有効", dot: "bg-success", text: "text-success", card: "border-success/30" },
  paused: { label: "一時停止", dot: "bg-warning", text: "text-warning", card: "border-warning/30" },
  completed: { label: "完了", dot: "bg-primary-400", text: "text-primary-600", card: "border-primary-200" },
};

export default function EngagementProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/engagement-programs").then((r) => r.json()).then((data) => { setPrograms(data); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = search ? programs.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : programs;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">エンゲージメントプログラム</h1>
            <p className="text-xs text-sf-weak mt-0.5">プロスペクトを自動的にナーチャリングします</p>
          </div>
          <button
            onClick={() => router.push("/ma/engagement-programs/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規プログラム
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2.5 flex items-center gap-3">
        <span className="text-xs text-sf-weak font-medium shrink-0">{filtered.length}件のプログラム</span>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="プログラムを検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="エンゲージメントプログラムがありません"
            description={search ? "検索条件に一致するプログラムがありません" : "メール送信・待機・条件分岐を組み合わせた自動ナーチャリングを作成します"}
            action={!search ? { label: "新規プログラム", onClick: () => router.push("/ma/engagement-programs/new") } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, dot: "bg-sf-weak", text: "text-sf-weak", card: "border-sf-border" };
              return (
                <Link
                  key={p.id}
                  href={`/ma/engagement-programs/${p.id}`}
                  className={cn(
                    "group bg-sf-surface border-l-4 border border-sf-border rounded-sf p-4 hover:shadow-md transition-all block",
                    cfg.card
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-sf bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 text-2xs font-medium", cfg.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-sf-text group-hover:text-primary-600 transition-colors mb-1.5">{p.name}</h3>
                  {p.description && (
                    <p className="text-2xs text-sf-weak mb-3 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-2xs text-sf-weak pt-2.5 border-t border-sf-border">
                    {p._count && (
                      <>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                          </svg>
                          {p._count.nodes}ステップ
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {p._count.enrollments}人登録
                        </span>
                      </>
                    )}
                    <span className="ml-auto">{new Date(p.updatedAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
