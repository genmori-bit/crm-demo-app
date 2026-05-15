"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";

interface Assignment {
  id: string;
  app: string;
  formFactor: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const FORM_FACTOR_LABELS: Record<string, string> = {
  DESKTOP: "デスクトップ",
  PHONE:   "スマートフォン",
  TABLET:  "タブレット",
};

export default function AssignmentsPage() {
  const { objectApiName, pageId } = useParams<{ objectApiName: string; pageId: string }>();
  const showToast = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    app: "",
    formFactor: "DESKTOP",
    priority: 0,
    isActive: true,
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/record-pages/${pageId}`)
      .then((r) => r.json())
      .then((data: { assignments?: Assignment[] }) => {
        setAssignments(data.assignments ?? []);
        setLoading(false);
      });
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.app.trim()) {
      showToast("アプリ名を入力してください", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/record-pages/${pageId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      showToast("割り当てを追加しました", "success");
      setShowForm(false);
      setForm({ app: "", formFactor: "DESKTOP", priority: 0, isActive: true });
      load();
    } else {
      const err = await res.json();
      showToast((err as { error?: string }).error ?? "追加に失敗しました", "error");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-sf-weak mb-2">
          <Link href="/settings/object-manager" className="hover:text-primary-600 hover:underline">Object Manager</Link>
          <span>›</span>
          <Link href={`/settings/object-manager/${objectApiName}`} className="hover:text-primary-600 hover:underline">{objectApiName}</Link>
          <span>›</span>
          <Link href={`/settings/object-manager/${objectApiName}/record-pages`} className="hover:text-primary-600 hover:underline">レコードページ</Link>
          <span>›</span>
          <Link href={`/settings/object-manager/${objectApiName}/record-pages/${pageId}/builder`} className="hover:text-primary-600 hover:underline">ビルダー</Link>
          <span>›</span>
          <span className="text-sf-text font-medium">割り当て</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-sf-text">ページ割り当て</h1>
          <Button onClick={() => setShowForm(true)}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            割り当てを追加
          </Button>
        </div>
      </div>

      {/* Add assignment form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sf shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-sf-text mb-4">割り当てを追加</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">アプリ *</label>
                <input
                  className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500"
                  value={form.app}
                  onChange={(e) => setForm((f) => ({ ...f, app: e.target.value }))}
                  placeholder="例: Sales App"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">フォームファクター</label>
                <select
                  className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500"
                  value={form.formFactor}
                  onChange={(e) => setForm((f) => ({ ...f, formFactor: e.target.value }))}
                >
                  {Object.entries(FORM_FACTOR_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-sf-weak block mb-1">優先度</label>
                <input
                  type="number"
                  className="w-full h-9 px-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-xs text-sf-text">有効</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="neutral" onClick={() => setShowForm(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving || !form.app.trim()}>
                {saving ? "追加中..." : "追加"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <PageLoading />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="割り当てがありません"
            description="アプリやフォームファクターに対してページを割り当ててください"
            action={<Button onClick={() => setShowForm(true)}>割り当てを追加</Button>}
          />
        ) : (
          <LightningCard>
            <LightningCardHeader title="割り当て一覧" count={assignments.length} />
            <div className="divide-y divide-sf-border/60">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-sf-bg/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-sf-text">{a.app}</span>
                      <Badge variant={a.isActive ? "success" : "muted"}>
                        {a.isActive ? "有効" : "無効"}
                      </Badge>
                    </div>
                    <p className="text-xs text-sf-weak">
                      {FORM_FACTOR_LABELS[a.formFactor] ?? a.formFactor}
                      {" · "}優先度: {a.priority}
                      {" · "}追加日: {new Date(a.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </LightningCard>
        )}
      </div>
    </div>
  );
}
