"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface Template {
  id: string;
  name: string;
  subject: string;
  type: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  regular: "通常",
  drip: "ドリップ",
  transactional: "トランザクション",
};

export default function EmailTemplatesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/email-templates").then((r) => r.json()).then((data) => { setTemplates(data); setLoading(false); });
  };
  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/ma/email-templates/${id}`, { method: "DELETE" });
    showToast("削除しました", "success");
    load();
  };

  const filtered = search ? templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())) : templates;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">メールテンプレート</h1>
            <p className="text-xs text-sf-weak mt-0.5">再利用可能なメール本文テンプレート</p>
          </div>
          <button
            onClick={() => router.push("/ma/email-templates/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規テンプレート
          </button>
        </div>
      </div>

      <ListViewToolbar
        total={filtered.length}
        objectLabel="テンプレート"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={load}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">テンプレート名 / 件名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">種類</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">更新日</th>
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border bg-sf-surface">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm text-sf-weak">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    読み込み中...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16">
                  <EmptyState
                    title="テンプレートがありません"
                    description={search ? "検索条件に一致するテンプレートがありません" : "再利用可能なメールテンプレートを作成しましょう"}
                    action={!search ? { label: "新規テンプレート", onClick: () => router.push("/ma/email-templates/new") } : undefined}
                  />
                </td>
              </tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-sf-bg transition-colors group">
                <td className="px-4 py-3">
                  <Link href={`/ma/email-templates/${t.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                    {t.name}
                  </Link>
                  <p className="text-2xs text-sf-weak mt-0.5 truncate max-w-md">{t.subject}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium bg-sf-bg border border-sf-border text-sf-text">
                    {TYPE_LABELS[t.type] ?? t.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xs text-sf-weak tabular-nums">{new Date(t.updatedAt).toLocaleDateString("ja-JP")}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
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
