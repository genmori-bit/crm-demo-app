"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

interface Form {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ma/forms").then((r) => r.json()).then((data) => { setForms(data); setLoading(false); });
  }, []);

  const filtered = search ? forms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) : forms;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">フォーム</h1>
            <p className="text-xs text-sf-weak mt-0.5">リード獲得フォームの作成・管理</p>
          </div>
          <button
            onClick={() => router.push("/ma/forms/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規フォーム
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2.5 flex items-center gap-3">
        <span className="text-xs text-sf-weak font-medium">{filtered.length}件のフォーム</span>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="フォームを検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="フォームがありません"
            description={search ? "検索条件に一致するフォームがありません" : "最初のリード獲得フォームを作成しましょう"}
            action={!search ? { label: "新規フォーム", onClick: () => router.push("/ma/forms/new") } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => (
              <Link
                key={f.id}
                href={`/ma/forms/${f.id}`}
                className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-300 hover:shadow-md transition-all block group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-sf bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-medium border ${f.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {f.isActive ? "有効" : "無効"}
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-sf-text group-hover:text-primary-600 transition-colors mb-1">{f.name}</h3>
                {f.description && (
                  <p className="text-2xs text-sf-weak mb-2.5 line-clamp-2 leading-relaxed">{f.description}</p>
                )}
                <p className="text-2xs text-sf-placeholder">{new Date(f.updatedAt).toLocaleDateString("ja-JP")} 更新</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
