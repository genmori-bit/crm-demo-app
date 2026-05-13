"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  defaultDateRange: string | null;
}

export default function EditDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    visibility: "PRIVATE",
    defaultDateRange: "",
  });

  useEffect(() => {
    api.get<Dashboard>(`/api/dashboards/${id}`)
      .then((d) => {
        setDashboard(d);
        setForm({
          name: d.name,
          description: d.description ?? "",
          visibility: d.visibility,
          defaultDateRange: d.defaultDateRange ?? "",
        });
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/api/dashboards/${id}`, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        visibility: form.visibility,
        defaultDateRange: form.defaultDateRange || null,
      });
      showToast("ダッシュボードを更新しました");
      router.push(`/dashboards/${id}`);
    } catch {
      showToast("更新に失敗しました", "error");
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sf-weak">ダッシュボードが見つかりません</p>
        <Link href="/dashboards"><Button variant="secondary" size="sm">一覧へ戻る</Button></Link>
      </div>
    );
  }

  if (!dashboard) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xs text-sf-weak mb-0.5">
            <Link href="/dashboards" className="hover:text-primary-500">ダッシュボード</Link>
            <span>/</span>
            <Link href={`/dashboards/${id}`} className="hover:text-primary-500">{dashboard.name}</Link>
            <span>/</span>
            <span>設定編集</span>
          </div>
          <h1 className="text-xl font-bold text-sf-text">ダッシュボード設定</h1>
        </div>
        <Link href={`/dashboards/${id}`}>
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
                  className="w-full border border-sf-border rounded-sf px-3 py-2 text-sm text-sf-text bg-sf-surface focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sf-text mb-1">説明</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <label className="block text-xs font-semibold text-sf-text mb-1">デフォルト期間フィルター</label>
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
                <Link href={`/dashboards/${id}`}>
                  <Button variant="secondary" size="sm" type="button">キャンセル</Button>
                </Link>
                <Button size="sm" type="submit" disabled={saving || !form.name.trim()}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </LightningCardBody>
        </LightningCard>
      </div>
    </div>
  );
}
