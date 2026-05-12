"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard } from "@/components/ui/lightning-card";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">担当者</h1>
            <p className="text-xs text-sf-weak">{contacts.length}件</p>
          </div>
        </div>
        <Button onClick={() => router.push("/contacts/new")}>
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Button>
      </div>

      <LightningCard>
        <ListViewToolbar
          total={loading ? undefined : contacts.length}
          objectLabel="担当者"
          searchValue={query}
          onSearchChange={setQuery}
          onRefresh={load}
          actions={
            <Button size="sm" onClick={() => router.push("/contacts/new")}>
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規
            </Button>
          }
        />

        {loading ? (
          <PageLoading />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="担当者が見つかりません"
            action={<Button onClick={() => router.push("/contacts/new")}>新規作成</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sf-border bg-sf-bg">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">氏名</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">会社</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">部署 / 役職</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">メール</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">電話</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-sf-bg transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                          <span className="text-2xs font-bold text-primary-600">{c.fullName[0]}</span>
                        </div>
                        <div>
                          <Link href={`/contacts/${c.id}`} className="font-medium text-primary-500 hover:underline">{c.fullName}</Link>
                          {c.isPrimary && <span className="ml-1.5 text-2xs text-primary-500 font-medium bg-primary-50 px-1 py-0.5 rounded">主担当</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/companies/${c.companyId}`} className="text-sf-text hover:text-primary-500 hover:underline">{c.company.companyName}</Link>
                    </td>
                    <td className="px-4 py-3 text-sf-text">{[c.department, c.title].filter(Boolean).join(" / ") || "-"}</td>
                    <td className="px-4 py-3 text-sf-text">{c.email ?? "-"}</td>
                    <td className="px-4 py-3 text-sf-text">{c.phone ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/contacts/${c.id}/edit`)}>編集</Button>
                        <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setDeleteId(c.id)}>削除</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

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
