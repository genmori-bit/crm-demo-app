"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", subject: "", fromName: "", fromEmail: "", previewText: "",
    bodyHtml: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<h2 style="color:#0176d3;">タイトル</h2>
<p>本文をここに入力してください。</p>
<p style="margin-top:30px;font-size:12px;color:#999;">
配信停止をご希望の方は<a href="{{unsubscribe_url}}">こちら</a>からお手続きください。
</p>
</body></html>`,
    type: "regular",
  });

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ma/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/email-templates/${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規メールテンプレート</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="テンプレート名 *" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <Input label="件名 *" value={form.subject} onChange={(e) => set("subject", e.target.value)} required />
          <Input label="プレビューテキスト" value={form.previewText} onChange={(e) => set("previewText", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="デフォルト差出人名" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} />
            <Input label="デフォルト差出人メール" type="email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">種類</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}
              className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text">
              <option value="regular">通常</option>
              <option value="drip">ドリップ</option>
            </select>
          </div>
        </div>
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sf-text">本文 (HTML)</h2>
          <p className="text-xs text-sf-weak">使用可能な変数: {"{{first_name}}"} {"{{last_name}}"} {"{{company}}"} {"{{unsubscribe_url}}"}</p>
          <textarea
            value={form.bodyHtml}
            onChange={(e) => set("bodyHtml", e.target.value)}
            rows={16}
            className="w-full rounded-sf border border-sf-border bg-sf-surface px-3 py-2 text-sm text-sf-text font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>保存</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
