"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

export default function NewDashboardPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    visibility: "PRIVATE",
    defaultDateRange: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const result = await api.post<{ id: string }>("/api/dashboards", {
        name: form.name.trim(),
        description: form.description.trim() || null,
        visibility: form.visibility,
        defaultDateRange: form.defaultDateRange || null,
      });
      showToast("ダッシュボードを作成しました");
      router.push(`/dashboards/${result.id}/builder`);
    } catch {
      showToast("作成に失敗しました", "error");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">ダッシュボード</p>
          <h1 className="text-xl font-bold text-sf-text">新規ダッシュボード</h1>
        </div>
        <Link href="/dashboards">
          <Button variant="secondary" size="sm">キャンセル</Button>
        </Link>
      </div>

      <div className="p-6 max-w-xl">
        <LightningCard>
          <LightningCardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-sf-text mb-1">
                  ダッシュボード名 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例: 営業ダッシュボード"
                  className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sf-text mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ダッシュボードの説明を入力..."
                  rows={3}
                  className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sf-text mb-1">公開範囲</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="PRIVATE">非公開（自分のみ）</option>
                  <option value="TEAM">チーム（チームメンバーに公開）</option>
                  <option value="PUBLIC">全体公開</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sf-text mb-1">デフォルト期間</label>
                <select
                  value={form.defaultDateRange}
                  onChange={(e) => setForm({ ...form, defaultDateRange: e.target.value })}
                  className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">指定なし</option>
                  <option value="thisMonth">今月</option>
                  <option value="thisQuarter">今四半期</option>
                  <option value="thisYear">今年</option>
                  <option value="last30">過去30日</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link href="/dashboards">
                  <Button variant="secondary" size="sm" type="button">キャンセル</Button>
                </Link>
                <Button size="sm" type="submit" disabled={saving || !form.name.trim()}>
                  {saving ? "作成中..." : "作成してウィジェットを追加"}
                </Button>
              </div>
            </form>
          </LightningCardBody>
        </LightningCard>
      </div>
    </div>
  );
}
