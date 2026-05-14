"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function NewCampaignPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "Email", status: "Planning", description: "",
    startDate: "", endDate: "", budget: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name) { showToast("キャンペーン名は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        description: form.description || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const c = await res.json();
      showToast("キャンペーンを作成しました", "success");
      router.push(`/campaigns/${c.id}`);
    } else {
      showToast("作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/campaigns" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">キャンペーン</p>
          <h1 className="text-xl font-bold text-sf-text">新規キャンペーン</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-sf-text">キャンペーン名 <span className="text-error">*</span></span>
            <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">タイプ</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="Email">メール</option>
                <option value="Event">イベント</option>
                <option value="Webinar">ウェビナー</option>
                <option value="Content">コンテンツ</option>
                <option value="SNS">SNS</option>
                <option value="Paid">有料広告</option>
                <option value="Other">その他</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">ステータス</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="Planning">計画中</option>
                <option value="Active">実施中</option>
                <option value="Completed">完了</option>
                <option value="Aborted">中止</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">開始日</span>
              <input type="date" className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">終了日</span>
              <input type="date" className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">予算</span>
            <input type="number" className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">説明</span>
            <textarea className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <Link href="/campaigns" className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
