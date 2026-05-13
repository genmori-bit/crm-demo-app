"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditProspectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", jobTitle: "", phone: "",
    website: "", industry: "", country: "", state: "", city: "",
    status: "active", doNotEmail: false, optedOut: false,
  });

  useEffect(() => {
    fetch(`/api/ma/prospects/${id}`).then((r) => r.json()).then((data) => {
      setForm({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        company: data.company ?? "",
        jobTitle: data.jobTitle ?? "",
        phone: data.phone ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        country: data.country ?? "",
        state: data.state ?? "",
        city: data.city ?? "",
        status: data.status ?? "active",
        doNotEmail: data.doNotEmail ?? false,
        optedOut: data.optedOut ?? false,
      });
    });
  }, [id]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/ma/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        company: form.company || null,
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        website: form.website || null,
        industry: form.industry || null,
        country: form.country || null,
        state: form.state || null,
        city: form.city || null,
      }),
    });
    if (res.ok) {
      router.push(`/ma/prospects/${id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">プロスペクト編集</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sf-text">基本情報</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="名" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            <Input label="姓" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </div>
          <Input label="会社名" value={form.company} onChange={(e) => set("company", e.target.value)} />
          <Input label="役職" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="電話番号" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            <Input label="Webサイト" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="業界" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            <Input label="国" value={form.country} onChange={(e) => set("country", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="都道府県" value={form.state} onChange={(e) => set("state", e.target.value)} />
            <Input label="市区町村" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sf-text">配信設定</h2>
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">ステータス</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}
              className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text">
              <option value="active">アクティブ</option>
              <option value="paused">一時停止</option>
              <option value="blacklisted">ブラックリスト</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.doNotEmail} onChange={(e) => set("doNotEmail", e.target.checked)} className="rounded" />
            <span className="text-sf-text">メール配信停止</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.optedOut} onChange={(e) => set("optedOut", e.target.checked)} className="rounded" />
            <span className="text-sf-text">オプトアウト済み</span>
          </label>
        </div>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>保存</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
