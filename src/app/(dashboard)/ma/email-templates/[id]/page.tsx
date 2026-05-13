"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Template {
  id: string; name: string; subject: string; fromName: string | null; fromEmail: string | null;
  previewText: string | null; bodyHtml: string; type: string; updatedAt: string;
}

export default function EmailTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [tpl, setTpl] = useState<Template | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", fromName: "", fromEmail: "", previewText: "", bodyHtml: "" });

  useEffect(() => {
    fetch(`/api/ma/email-templates/${id}`).then((r) => r.json()).then((data) => {
      setTpl(data);
      setForm({ name: data.name, subject: data.subject, fromName: data.fromName ?? "", fromEmail: data.fromEmail ?? "", previewText: data.previewText ?? "", bodyHtml: data.bodyHtml });
    });
  }, [id]);

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const onSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/ma/email-templates/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setTpl(data);
      setEditing(false);
      showToast("保存しました", "success");
    } else showToast("保存に失敗しました", "error");
    setSaving(false);
  };

  if (!tpl) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/ma/email-templates" className="text-xs text-sf-weak hover:underline">← テンプレート一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{tpl.name}</h1>
        </div>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? "キャンセル" : "編集"}</Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
            <Input label="テンプレート名" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <Input label="件名" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
            <Input label="プレビューテキスト" value={form.previewText} onChange={(e) => set("previewText", e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="差出人名" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} />
              <Input label="差出人メール" type="email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} />
            </div>
          </div>
          <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-2">
            <h2 className="text-sm font-semibold text-sf-text">本文 (HTML)</h2>
            <textarea value={form.bodyHtml} onChange={(e) => set("bodyHtml", e.target.value)} rows={16}
              className="w-full rounded-sf border border-sf-border bg-sf-surface px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Button onClick={onSave} loading={saving}>保存</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-sf-weak text-xs">件名</dt><dd>{tpl.subject}</dd></div>
              <div><dt className="text-sf-weak text-xs">種類</dt><dd>{tpl.type === "regular" ? "通常" : "ドリップ"}</dd></div>
              {tpl.fromName && <div><dt className="text-sf-weak text-xs">差出人名</dt><dd>{tpl.fromName}</dd></div>}
              {tpl.fromEmail && <div><dt className="text-sf-weak text-xs">差出人メール</dt><dd>{tpl.fromEmail}</dd></div>}
              <div><dt className="text-sf-weak text-xs">更新日</dt><dd>{new Date(tpl.updatedAt).toLocaleDateString("ja-JP")}</dd></div>
            </dl>
          </div>
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">本文プレビュー</h2>
            <div className="border border-sf-border rounded p-4 bg-white prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: tpl.bodyHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
