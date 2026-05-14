"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function NewCasePage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject: "", description: "", status: "New", priority: "Medium",
    origin: "", type: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.subject) { showToast("件名は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        origin: form.origin || null,
        type: form.type || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const c = await res.json();
      showToast("ケースを作成しました", "success");
      router.push(`/cases/${c.id}`);
    } else {
      showToast("作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/cases" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">ケース</p>
          <h1 className="text-xl font-bold text-sf-text">新規ケース</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-sf-text">件名 <span className="text-error">*</span></span>
            <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">ステータス</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="New">新規</option>
                <option value="Open">対応中</option>
                <option value="Pending Customer">顧客待ち</option>
                <option value="Pending Internal">社内待ち</option>
                <option value="Escalated">エスカレート</option>
                <option value="Closed">クローズ</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">優先度</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="Critical">緊急</option>
                <option value="High">高</option>
                <option value="Medium">中</option>
                <option value="Low">低</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">タイプ</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">-- 選択 --</option>
                <option value="Question">質問</option>
                <option value="Bug">不具合</option>
                <option value="Feature Request">機能要望</option>
                <option value="Other">その他</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">問い合わせ経路</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.origin} onChange={(e) => set("origin", e.target.value)}>
                <option value="">-- 選択 --</option>
                <option value="Email">メール</option>
                <option value="Phone">電話</option>
                <option value="Web">Web</option>
                <option value="Chat">チャット</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">説明</span>
            <textarea className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <Link href="/cases" className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
