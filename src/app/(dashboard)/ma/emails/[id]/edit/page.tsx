"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface List { id: string; name: string; _count: { memberships: number } }

export default function EditEmailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [form, setForm] = useState({
    name: "", subject: "", fromName: "", fromEmail: "", listId: "", bodyHtml: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/ma/emails/${id}`).then((r) => r.json()),
      fetch("/api/ma/lists").then((r) => r.json()),
    ]).then(([email, ls]) => {
      setForm({
        name: email.name ?? "",
        subject: email.subject ?? "",
        fromName: email.fromName ?? "",
        fromEmail: email.fromEmail ?? "",
        listId: email.list?.id ?? "",
        bodyHtml: email.bodyHtml ?? "",
      });
      setLists(ls);
    });
  }, [id]);

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/ma/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, listId: form.listId || null }),
    });
    if (res.ok) {
      router.push(`/ma/emails/${id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">メール編集</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="メール名 *" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <Input label="件名 *" value={form.subject} onChange={(e) => set("subject", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="差出人名" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} />
            <Input label="差出人メール" type="email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">送信リスト</label>
            <select
              value={form.listId}
              onChange={(e) => set("listId", e.target.value)}
              className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text"
            >
              <option value="">リストを選択...</option>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l._count.memberships}人)</option>)}
            </select>
          </div>
        </div>
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sf-text">本文 (HTML)</h2>
          <textarea
            value={form.bodyHtml}
            onChange={(e) => set("bodyHtml", e.target.value)}
            rows={12}
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
