"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRow } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  companyId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  isPrimary: boolean;
  company: { companyName: string };
}

export default function ContactsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const data = await api.get<Contact[]>(`/api/contacts?${params}`);
    setContacts(data);
    setLoading(false);
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/contacts/${deleteId}`);
      showToast("担当者を削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">CRM</p>
            <h1 className="text-xl font-bold text-sf-text">担当者</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/contacts/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規担当者
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-sf-weak shrink-0 tabular-nums">
          {loading ? "読み込み中..." : `${contacts.length.toLocaleString()} 件`}
        </span>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="氏名・会社・メールで検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="担当者を検索"
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
              <th className="text-left px-6 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">氏名</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">会社</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">部署 / 役職</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">メール</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">電話</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="担当者が見つかりません"
                    description="検索条件を変えるか、新規担当者を作成してください"
                    action={<Button onClick={() => router.push("/contacts/new")}>新規担当者作成</Button>}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            ) : contacts.map((c) => (
              <tr
                key={c.id}
                className="border-b border-sf-border/60 hover:bg-info-light/30 cursor-pointer transition-colors group"
                onClick={() => router.push(`/contacts/${c.id}`)}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/contacts/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary-600 hover:underline hover:text-primary-700 text-sm"
                    >
                      {c.fullName}
                    </Link>
                    {c.isPrimary && (
                      <span className="text-2xs text-primary-600 font-medium bg-info-light border border-info-border px-1 py-0.5 rounded whitespace-nowrap">主担当</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/companies/${c.companyId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-sf-text hover:text-primary-600 hover:underline"
                  >
                    {c.company.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-sf-text">
                  {[c.department, c.title].filter(Boolean).join(" / ") || <span className="text-sf-weak">—</span>}
                </td>
                <td className="px-4 py-3">
                  {c.email
                    ? <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-sf-text hover:text-primary-600 hover:underline">{c.email}</a>
                    : <span className="text-sf-weak text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-sf-text">
                  {c.phone ?? <span className="text-sf-weak">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/contacts/${c.id}/edit`); }}
                      className="text-xs text-sf-weak hover:text-primary-600 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="担当者の削除"
        message="この担当者を削除しますか？"
        loading={deleting}
      />
    </div>
  );
}
