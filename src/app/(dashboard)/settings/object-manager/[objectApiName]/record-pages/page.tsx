"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LightningCard } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";

interface RecordPage {
  id: string;
  label: string;
  apiName: string;
  status: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "muted" | "warning" }> = {
  ACTIVE:   { label: "有効",   variant: "success" },
  DRAFT:    { label: "下書き", variant: "muted" },
  ARCHIVED: { label: "アーカイブ", variant: "warning" },
};

const TEMPLATE_LABELS: Record<string, string> = {
  HEADER_RIGHT_SIDEBAR:    "ヘッダー＋右サイドバー",
  HEADER_TWO_COLUMNS:      "2カラム",
  TABS_WITH_RIGHT_SIDEBAR: "タブ＋右サイドバー",
  FULL_WIDTH:              "全幅",
  CUSTOM:                  "カスタム",
};

export default function RecordPagesListPage() {
  const { objectApiName } = useParams<{ objectApiName: string }>();
  const router = useRouter();
  const [pages, setPages] = useState<RecordPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newApiName, setNewApiName] = useState("");
  const [newTemplate, setNewTemplate] = useState("TABS_WITH_RIGHT_SIDEBAR");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/record-pages?objectApiName=${encodeURIComponent(objectApiName)}`)
      .then((r) => r.json())
      .then((data) => { setPages(data.pages ?? data ?? []); setLoading(false); });
  }, [objectApiName]);

  useEffect(() => { load(); }, [load]);

  const handleLabelChange = (v: string) => {
    setNewLabel(v);
    setNewApiName(v.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() + "_page");
  };

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    const res = await fetch("/api/record-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectApiName, label: newLabel, apiName: newApiName, template: newTemplate }),
    });
    if (res.ok) {
      const page = await res.json();
      router.push(`/settings/object-manager/${objectApiName}/record-pages/${page.id}/builder`);
    }
    setSaving(false);
  };

  const handlePublish = async (pageId: string) => {
    await fetch(`/api/record-pages/${pageId}/publish`, { method: "POST" });
    load();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-sf-weak mb-2">
          <Link href="/settings/object-manager" className="hover:text-primary-600 hover:underline">Object Manager</Link>
          <span>›</span>
          <Link href={`/settings/object-manager/${objectApiName}`} className="hover:text-primary-600 hover:underline">{objectApiName}</Link>
          <span>›</span>
          <span className="text-sf-text font-medium">レコードページ</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-sf-text">レコードページ</h1>
          <Button onClick={() => setShowNew(true)}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            新規ページ
          </Button>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sf shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-sf-text mb-4">新規レコードページ</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">ページラベル *</label>
                <input className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={newLabel} onChange={(e) => handleLabelChange(e.target.value)} placeholder="例: 取引先360" />
              </div>
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">API参照名</label>
                <input className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500 bg-sf-bg" value={newApiName} onChange={(e) => setNewApiName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">テンプレート</label>
                <select className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500" value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)}>
                  {Object.entries(TEMPLATE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="neutral" onClick={() => setShowNew(false)}>キャンセル</Button>
              <Button onClick={handleCreate} disabled={saving || !newLabel.trim()}>{saving ? "作成中..." : "作成してビルダーを開く"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6">
        {loading ? <PageLoading /> : pages.length === 0 ? (
          <EmptyState title="レコードページがありません" description="新規ページを作成してください" action={<Button onClick={() => setShowNew(true)}>新規ページを作成</Button>} />
        ) : (
          <LightningCard>
            <div className="divide-y divide-sf-border/60">
              {pages.map((p) => {
                const s = STATUS_BADGE[p.status] ?? { label: p.status, variant: "muted" as const };
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-sf-bg/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-sf-text">{p.label}</span>
                        {p.isDefault && <Badge variant="brand">デフォルト</Badge>}
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <p className="text-xs text-sf-weak">{p.apiName} · {TEMPLATE_LABELS[p.template] ?? p.template}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.status === "DRAFT" && (
                        <Button size="xs" variant="neutral" onClick={() => handlePublish(p.id)}>有効化</Button>
                      )}
                      <Button size="xs" variant="neutral" onClick={() => router.push(`/settings/object-manager/${objectApiName}/record-pages/${p.id}/builder`)}>編集</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </LightningCard>
        )}
      </div>
    </div>
  );
}
