"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader } from "@/components/ui/lightning-card";
import { cn } from "@/lib/utils";

interface PermissionSet {
  id: string;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  _count: { assignments: number };
}

const PERM_GROUPS = [
  { label: "企業", keys: ["company.view", "company.create", "company.edit", "company.delete", "company.export"] },
  { label: "担当者", keys: ["contact.view", "contact.create", "contact.edit", "contact.delete"] },
  { label: "商談", keys: ["deal.view", "deal.create", "deal.edit", "deal.delete", "deal.export"] },
  { label: "MA", keys: ["ma.view", "ma.prospect.view", "ma.prospect.edit", "ma.email.view", "ma.email.send", "ma.form.edit", "ma.program.edit"] },
  { label: "設定", keys: ["setup.view", "setup.user.view", "setup.user.create", "setup.user.edit", "setup.role.manage", "setup.profile.manage", "setup.permissionset.manage", "setup.team.manage", "setup.security.manage", "setup.audit.view"] },
  { label: "データ", keys: ["data.import", "data.export", "data.tags.manage"] },
];

const PERM_LABELS: Record<string, string> = {
  "company.view": "企業閲覧", "company.create": "企業作成", "company.edit": "企業編集", "company.delete": "企業削除", "company.export": "企業エクスポート",
  "contact.view": "担当者閲覧", "contact.create": "担当者作成", "contact.edit": "担当者編集", "contact.delete": "担当者削除",
  "deal.view": "商談閲覧", "deal.create": "商談作成", "deal.edit": "商談編集", "deal.delete": "商談削除", "deal.export": "商談エクスポート",
  "ma.view": "MA閲覧", "ma.prospect.view": "プロスペクト閲覧", "ma.prospect.edit": "プロスペクト編集",
  "ma.email.view": "メール閲覧", "ma.email.send": "メール送信", "ma.form.edit": "フォーム編集", "ma.program.edit": "プログラム編集",
  "setup.view": "設定閲覧", "setup.user.view": "ユーザー閲覧", "setup.user.create": "ユーザー作成",
  "setup.user.edit": "ユーザー編集", "setup.role.manage": "ロール管理", "setup.profile.manage": "プロファイル管理",
  "setup.permissionset.manage": "権限セット管理", "setup.team.manage": "チーム管理",
  "setup.security.manage": "セキュリティ管理", "setup.audit.view": "監査ログ閲覧",
  "data.import": "インポート", "data.export": "エクスポート", "data.tags.manage": "タグ管理",
};

export default function PermissionSetsPage() {
  const showToast = useToast();
  const [sets, setSets] = useState<PermissionSet[]>([]);
  const [selected, setSelected] = useState<PermissionSet | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", label: "", description: "" });

  const load = () => {
    fetch("/api/settings/permission-sets").then((r) => r.json()).then((data) => {
      const arr = Array.isArray(data) ? data : [];
      setSets(arr);
      if (selected) {
        const updated = arr.find((p: PermissionSet) => p.id === selected.id);
        if (updated) { setSelected(updated); setEditPerms(updated.permissions); }
      }
    });
  };
  useEffect(load, []);

  const select = (ps: PermissionSet) => { setSelected(ps); setEditPerms(ps.permissions); };
  const togglePerm = (key: string) => { if (selected?.isSystem) return; setEditPerms((p) => ({ ...p, [key]: !p[key] })); };

  const savePerms = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/settings/permission-sets/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: editPerms }),
    });
    setSaving(false);
    if (res.ok) { showToast("保存しました", "success"); load(); }
    else showToast("保存に失敗しました", "error");
  };

  const create = async () => {
    if (!newForm.name.trim() || !newForm.label.trim()) { showToast("名前とラベルは必須です", "error"); return; }
    const res = await fetch("/api/settings/permission-sets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) { showToast("作成しました", "success"); setShowNew(false); setNewForm({ name: "", label: "", description: "" }); load(); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs text-sf-weak">設定</p>
            <h1 className="text-xl font-bold text-sf-text">権限セット</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規
          </button>
        </div>
      </div>

      {showNew && (
        <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
          <div className="flex gap-3 items-end max-w-xl">
            <div>
              <label className="block text-2xs font-semibold text-sf-weak mb-1">API名 *</label>
              <input value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ma_sender" className="h-9 px-3 text-xs rounded-sf border border-sf-border focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-sf-weak mb-1">表示名 *</label>
              <input value={newForm.label} onChange={(e) => setNewForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="MAメール送信者" className="h-9 px-3 text-xs rounded-sf border border-sf-border focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500" />
            </div>
            <button onClick={create} className="h-9 px-3 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600">作成</button>
            <button onClick={() => setShowNew(false)} className="h-9 px-3 text-xs font-medium border border-sf-border rounded-sf hover:bg-sf-bg">キャンセル</button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-56 border-r border-sf-border bg-sf-surface overflow-y-auto shrink-0">
          {sets.map((ps) => (
            <button key={ps.id} onClick={() => select(ps)}
              className={cn("w-full text-left px-4 py-3 border-b border-sf-border hover:bg-sf-bg transition-colors",
                selected?.id === ps.id ? "bg-primary-50 border-l-2 border-l-primary-500" : "")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sf-text">{ps.label}</span>
                {ps.isSystem && <span className="text-2xs bg-sf-bg text-sf-weak px-1 rounded">sys</span>}
              </div>
              <p className="text-2xs text-sf-weak mt-0.5">{ps._count.assignments}人割当済み</p>
            </button>
          ))}
        </div>

        {/* Matrix */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-sf-text">{selected.label}</h2>
                <p className="text-2xs text-sf-weak">API名: {selected.name}</p>
                {selected.description && <p className="text-xs text-sf-weak mt-0.5">{selected.description}</p>}
              </div>
              {!selected.isSystem && (
                <button onClick={savePerms} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50">
                  {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  保存
                </button>
              )}
            </div>
            <div className="space-y-4">
              {PERM_GROUPS.map((group) => (
                <LightningCard key={group.label}>
                  <LightningCardHeader title={group.label} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-sf-border border border-sf-border">
                    {group.keys.map((key) => (
                      <label key={key} className={cn("flex items-center gap-2 px-3 py-2.5 bg-sf-surface text-xs", selected.isSystem ? "cursor-default" : "cursor-pointer hover:bg-sf-bg")}>
                        <input type="checkbox" checked={!!editPerms[key]} onChange={() => togglePerm(key)} disabled={selected.isSystem}
                          className="w-3.5 h-3.5 rounded text-primary-500 border-sf-border focus:ring-primary-100" />
                        <span className="text-sf-text">{PERM_LABELS[key] ?? key}</span>
                      </label>
                    ))}
                  </div>
                </LightningCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-sf-weak">
            権限セットを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
