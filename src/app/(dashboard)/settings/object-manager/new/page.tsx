"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function NewObjectPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", labelPlural: "", apiName: "", description: "" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const autoApiName = (label: string) => {
    const cleaned = label.replace(/[^a-zA-Z0-9　-鿿]/g, "_").replace(/_+/g, "_");
    return cleaned ? `${cleaned}__c` : "";
  };

  const save = async () => {
    if (!form.label || !form.apiName) { showToast("ラベルとAPI名は必須です", "error"); return; }
    if (!form.apiName.endsWith("__c")) { showToast("API名は__cで終わる必要があります", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/object-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
        labelPlural: form.labelPlural || form.label,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const obj = await res.json();
      showToast("オブジェクトを作成しました", "success");
      router.push(`/settings/object-manager/${obj.id}`);
    } else {
      const err = await res.json();
      showToast(err.error ?? "作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/settings/object-manager" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">オブジェクトマネージャー</p>
          <h1 className="text-xl font-bold text-sf-text">新規カスタムオブジェクト</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-sf-text">ラベル (単数形) <span className="text-error">*</span></span>
              <input
                className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm"
                value={form.label}
                onChange={(e) => {
                  set("label", e.target.value);
                  if (!form.apiName || form.apiName === autoApiName(form.label)) {
                    set("apiName", autoApiName(e.target.value));
                  }
                }}
                placeholder="例: プロジェクト"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-sf-text">ラベル (複数形)</span>
              <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={form.labelPlural} onChange={(e) => set("labelPlural", e.target.value)} placeholder="例: プロジェクト一覧" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">API名 <span className="text-error">*</span></span>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="w-full border border-sf-border rounded px-3 py-1.5 text-sm font-mono"
                value={form.apiName}
                onChange={(e) => set("apiName", e.target.value)}
                placeholder="例: Project__c"
              />
            </div>
            <p className="text-2xs text-sf-weak mt-1">英数字アンダースコアのみ使用可。必ず__cで終わらせてください。</p>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-sf-text">説明</span>
            <textarea className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "作成中..." : "作成"}
            </button>
            <Link href="/settings/object-manager" className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">キャンセル</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
