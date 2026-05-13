"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewLandingPagePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", title: "", slug: "", description: "", metaTitle: "", metaDesc: "",
    bodyHtml: `<div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:sans-serif;">
  <h1 style="color:#0176d3;font-size:2em;margin-bottom:16px;">ページタイトル</h1>
  <p style="font-size:1.1em;color:#444;line-height:1.6;">説明文をここに入力してください。</p>
</div>`,
  });
  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const autoSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    set("slug", slug);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ma/landing-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, description: form.description || null, metaTitle: form.metaTitle || null, metaDesc: form.metaDesc || null }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/landing-pages/${data.id}`);
    } else {
      const err = await res.json();
      setError(typeof err.error === "string" ? err.error : "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規ランディングページ</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="ページ名 *" value={form.name} onChange={(e) => { set("name", e.target.value); if (!form.slug) autoSlug(e.target.value); }} required />
          <Input label="ページタイトル *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          <Input
            label="URL スラッグ * (例: campaign-2024)"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
          />
          <Input label="説明" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sf-text">本文 (HTML)</h2>
          <textarea value={form.bodyHtml} onChange={(e) => set("bodyHtml", e.target.value)} rows={14}
            className="w-full rounded-sf border border-sf-border bg-sf-surface px-3 py-2 text-sm text-sf-text font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>下書きで保存</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
