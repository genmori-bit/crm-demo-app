"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

interface Role {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  parent: { id: string; name: string } | null;
  _count: { children: number };
}

export default function RolesPage() {
  const showToast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", parentId: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/settings/roles").then((r) => r.json()).then((data) => setRoles(Array.isArray(data) ? data : []));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) { showToast("ロール名は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/settings/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description || null, parentId: form.parentId || null }),
    });
    setSaving(false);
    if (res.ok) { showToast("ロールを作成しました", "success"); setShowNew(false); setForm({ name: "", description: "", parentId: "" }); load(); }
    else showToast("作成に失敗しました", "error");
  };

  const deleteRole = async (id: string) => {
    const res = await fetch(`/api/settings/roles/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("削除しました", "success"); load(); }
    else showToast("削除に失敗しました", "error");
  };

  const inputCls = "h-9 px-3 text-xs rounded-sf border border-sf-border bg-sf-surface focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs text-sf-weak">設定</p>
            <h1 className="text-xl font-bold text-sf-text">ロール</h1>
            <p className="text-xs text-sf-weak mt-0.5">{roles.length}件</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規ロール
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-3xl space-y-4">
        {showNew && (
          <LightningCard>
            <LightningCardHeader title="新規ロール" />
            <LightningCardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ロール名 *" className={`${inputCls} w-full`} />
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="説明" className={`${inputCls} w-full`} />
                <select value={form.parentId} onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                  className={`${inputCls} w-full`}>
                  <option value="">上位ロール（なし）</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50">
                  {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}保存
                </button>
                <button onClick={() => setShowNew(false)} className="px-3 py-1.5 text-xs font-medium border border-sf-border rounded-sf hover:bg-sf-bg">キャンセル</button>
              </div>
            </LightningCardBody>
          </LightningCard>
        )}

        <LightningCard>
          <LightningCardHeader title="ロール一覧" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-sf-border bg-sf-bg">
                <tr>
                  <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ロール名</th>
                  <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">上位ロール</th>
                  <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">説明</th>
                  <th className="px-4 py-2.5 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {roles.map((r) => (
                  <tr key={r.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-sf-text">{r.name}</td>
                    <td className="px-4 py-3 text-xs text-sf-weak">{r.parent?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-sf-weak">{r.description ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteRole(r.id)} className="text-2xs text-danger hover:underline">削除</button>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-sf-weak">ロールがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </LightningCard>
      </div>
    </div>
  );
}
