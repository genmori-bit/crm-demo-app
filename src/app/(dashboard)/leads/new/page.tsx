"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function NewLeadPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    title: "",
    industry: "",
    website: "",
    source: "",
    status: "NEW",
    rating: "COLD",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.lastName) { showToast("姓は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fullName: [form.firstName, form.lastName].filter(Boolean).join(" "),
        email: form.email || null,
        phone: form.phone || null,
        companyName: form.companyName || null,
        title: form.title || null,
        industry: form.industry || null,
        website: form.website || null,
        source: form.source || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const lead = await res.json();
      showToast("リードを作成しました", "success");
      router.push(`/leads/${lead.id}`);
    } else {
      showToast("作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/leads" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">リード</p>
          <h1 className="text-xl font-bold text-sf-text">新規リード</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">名</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">姓 <span className="text-error">*</span></span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">メールアドレス</span>
            <input type="email" className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">電話</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">会社名</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">役職</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">業種</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">ステータス</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="NEW">新規</option>
                <option value="WORKING">対応中</option>
                <option value="NURTURING">育成中</option>
                <option value="DISQUALIFIED">失格</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">評価</span>
              <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.rating} onChange={(e) => set("rating", e.target.value)}>
                <option value="HOT">HOT</option>
                <option value="WARM">WARM</option>
                <option value="COLD">COLD</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">ソース</span>
            <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.source} onChange={(e) => set("source", e.target.value)}>
              <option value="">-- 選択 --</option>
              <option value="Web">Web</option>
              <option value="Email">メール</option>
              <option value="Phone">電話</option>
              <option value="Event">イベント</option>
              <option value="Partner">パートナー</option>
              <option value="Referral">紹介</option>
              <option value="SNS">SNS</option>
            </select>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <Link href="/leads" className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
