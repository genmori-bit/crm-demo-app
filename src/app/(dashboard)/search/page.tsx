"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";

interface SearchResult {
  type: "company" | "contact" | "deal" | "lead" | "case" | "campaign";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  company: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  contact: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  deal: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  lead: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  case: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  campaign: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
};

const TYPE_LABELS: Record<string, string> = {
  company: "企業",
  contact: "担当者",
  deal: "商談",
  lead: "リード",
  case: "ケース",
  campaign: "キャンペーン",
};

const TYPE_COLORS: Record<string, string> = {
  company: "text-primary-500 bg-primary-50",
  contact: "text-purple-600 bg-purple-50",
  deal: "text-orange-600 bg-orange-50",
  lead: "text-blue-600 bg-blue-50",
  case: "text-red-600 bg-red-50",
  campaign: "text-green-600 bg-green-50",
};

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setResults(null);
    api.get<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`).then(setResults);
  }, [q]);

  if (results === null) return <PageLoading />;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      {results.length === 0 ? (
        <LightningCard>
          <LightningCardBody>
            <div className="py-8 text-center">
              <p className="text-sf-text font-medium">{q ? `「${q}」に一致する結果はありません` : "検索キーワードを入力してください"}</p>
              {q && <p className="text-xs text-sf-weak mt-1">スペルを確認するか、別のキーワードで試してください</p>}
            </div>
          </LightningCardBody>
        </LightningCard>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <LightningCard key={type}>
            <div className="px-4 py-3 border-b border-sf-border flex items-center gap-2">
              <span className={`p-1.5 rounded ${TYPE_COLORS[type]}`}>
                {TYPE_ICONS[type]}
              </span>
              <span className="text-sm font-semibold text-sf-text">{TYPE_LABELS[type] ?? type}</span>
              <span className="ml-auto text-xs text-sf-weak">{items.length}件</span>
            </div>
            <ul className="divide-y divide-sf-border">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-sf-bg/40 transition-colors">
                    <div className={`p-1.5 rounded-full ${TYPE_COLORS[type]}`}>
                      {TYPE_ICONS[type]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-sf-text">{item.title}</p>
                      <p className="text-xs text-sf-weak">{item.subtitle}</p>
                    </div>
                    <svg className="w-4 h-4 text-sf-weak ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </LightningCard>
        ))
      )}
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <h1 className="text-xl font-bold text-sf-text">
          {q ? `「${q}」の検索結果` : "グローバル検索"}
        </h1>
      </div>
      <Suspense fallback={<PageLoading />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
