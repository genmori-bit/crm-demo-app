"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewProspectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", company: "", jobTitle: "", phone: "", source: "manual",
  });

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/ma/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/prospects/${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規プロスペクト</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sf-text">基本情報</h2>
          <Input label="メールアドレス *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="名" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            <Input label="姓" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
          <Input label="会社名" value={form.company} onChange={(e) => set("company", e.target.value)} />
          <Input label="役職" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          <Input label="電話番号" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">ソース</label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text"
            >
              <option value="manual">手動</option>
              <option value="web">Webフォーム</option>
              <option value="import">インポート</option>
              <option value="api">API</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>保存</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
