"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewEngagementProgramPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ma/engagement-programs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, description: form.description || null }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/engagement-programs/${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規エンゲージメントプログラム</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="プログラム名 *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">説明</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full rounded-sf border border-sf-border bg-sf-surface px-3 py-2 text-sm text-sf-text resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-sf p-3 text-xs text-blue-700">
          作成後にステップ（メール送信・待機・条件分岐）を追加できます。
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>下書きで作成</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
