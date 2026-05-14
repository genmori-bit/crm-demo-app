"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PERMISSIONS, PermissionKey } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Record<string, boolean>;
  _count: { users: number };
}

const PERM_GROUPS = [
  { label: "企業", keys: ["company.view", "company.create", "company.edit", "company.delete", "company.export"] },
  { label: "担当者", keys: ["contact.view", "contact.create", "contact.edit", "contact.delete"] },
  { label: "商談", keys: ["deal.view", "deal.create", "deal.edit", "deal.delete", "deal.export"] },
  { label: "活動", keys: ["activity.view", "activity.create", "activity.edit", "activity.delete"] },
  { label: "タスク", keys: ["task.view", "task.create", "task.edit", "task.delete"] },
  { label: "レポート", keys: ["report.view", "report.create", "report.edit", "report.delete"] },
  { label: "ダッシュボード", keys: ["dashboard.view", "dashboard.create", "dashboard.edit", "dashboard.delete"] },
  { label: "MA", keys: ["ma.view", "ma.prospect.view", "ma.prospect.edit", "ma.email.view", "ma.email.send", "ma.form.view", "ma.form.edit", "ma.program.view", "ma.program.edit"] },
  { label: "設定", keys: ["setup.view", "setup.user.view", "setup.user.create", "setup.user.edit", "setup.user.disable", "setup.role.manage", "setup.profile.manage", "setup.permissionset.manage", "setup.team.manage", "setup.appaccess.manage", "setup.security.manage", "setup.audit.view", "setup.org.manage"] },
  { label: "データ", keys: ["data.import", "data.export", "data.tags.manage"] },
];

const PERM_LABELS: Record<string, string> = {
  "company.view": "閲覧", "company.create": "作成", "company.edit": "編集", "company.delete": "削除", "company.export": "エクスポート",
  "contact.view": "閲覧", "contact.create": "作成", "contact.edit": "編集", "contact.delete": "削除",
  "deal.view": "閲覧", "deal.create": "作成", "deal.edit": "編集", "deal.delete": "削除", "deal.export": "エクスポート",
  "activity.view": "閲覧", "activity.create": "作成", "activity.edit": "編集", "activity.delete": "削除",
  "task.view": "閲覧", "task.create": "作成", "task.edit": "編集", "task.delete": "削除",
  "report.view": "閲覧", "report.create": "作成", "report.edit": "編集", "report.delete": "削除",
  "dashboard.view": "閲覧", "dashboard.create": "作成", "dashboard.edit": "編集", "dashboard.delete": "削除",
  "ma.view": "MA閲覧", "ma.prospect.view": "プロスペクト閲覧", "ma.prospect.edit": "プロスペクト編集",
  "ma.email.view": "メール閲覧", "ma.email.send": "メール送信", "ma.form.view": "フォーム閲覧",
  "ma.form.edit": "フォーム編集", "ma.program.view": "プログラム閲覧", "ma.program.edit": "プログラム編集",
  "setup.view": "設定閲覧", "setup.user.view": "ユーザー閲覧", "setup.user.create": "ユーザー作成",
  "setup.user.edit": "ユーザー編集", "setup.user.disable": "ユーザー無効化",
  "setup.role.manage": "ロール管理", "setup.profile.manage": "プロファイル管理",
  "setup.permissionset.manage": "権限セット管理", "setup.team.manage": "チーム管理",
  "setup.appaccess.manage": "アプリアクセス管理", "setup.security.manage": "セキュリティ管理",
  "setup.audit.view": "監査ログ閲覧", "setup.org.manage": "組織設定管理",
  "data.import": "インポート", "data.export": "エクスポート", "data.tags.manage": "タグ管理",
};

export default function ProfilesPage() {
  const showToast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const load = () => {
    fetch("/api/settings/profiles").then((r) => r.json()).then((data) => {
      const arr = Array.isArray(data) ? data : [];
      setProfiles(arr);
      if (selected) {
        const updated = arr.find((p: Profile) => p.id === selected.id);
        if (updated) { setSelected(updated); setEditPerms(updated.permissions); }
      }
    });
  };
  useEffect(load, []);

  const selectProfile = (p: Profile) => {
    setSelected(p);
    setEditPerms(p.permissions);
  };

  const togglePerm = (key: string) => {
    if (selected?.isSystem) return;
    setEditPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePerms = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/settings/profiles/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: editPerms }),
    });
    setSaving(false);
    if (res.ok) { showToast("保存しました", "success"); load(); }
    else showToast("保存に失敗しました", "error");
  };

  const createProfile = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/settings/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      showToast("プロファイルを作成しました", "success");
      setShowNew(false); setNewName(""); load();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs text-sf-weak">設定</p>
            <h1 className="text-xl font-bold text-sf-text">プロファイル</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規プロファイル
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Profile list sidebar */}
        <div className="w-56 border-r border-sf-border bg-sf-surface overflow-y-auto shrink-0">
          {showNew && (
            <div className="p-3 border-b border-sf-border">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createProfile(); if (e.key === "Escape") setShowNew(false); }}
                placeholder="プロファイル名..."
                className="w-full h-8 px-2 text-xs rounded-sf border border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              <div className="flex gap-1.5 mt-2">
                <button onClick={createProfile} className="flex-1 text-2xs font-medium bg-primary-500 text-white rounded-sf py-1 hover:bg-primary-600">作成</button>
                <button onClick={() => setShowNew(false)} className="flex-1 text-2xs text-sf-text border border-sf-border rounded-sf py-1 hover:bg-sf-bg">キャンセル</button>
              </div>
            </div>
          )}
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProfile(p)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-sf-border hover:bg-sf-bg transition-colors",
                selected?.id === p.id ? "bg-primary-50 border-l-2 border-l-primary-500" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sf-text">{p.name}</span>
                {p.isSystem && <span className="text-2xs bg-sf-bg text-sf-weak px-1 rounded">system</span>}
              </div>
              <p className="text-2xs text-sf-weak mt-0.5">{p._count.users}人</p>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-sf-text">{selected.name}</h2>
                {selected.isSystem && <p className="text-2xs text-sf-weak mt-0.5">システムプロファイル — 権限を変更できません</p>}
              </div>
              {!selected.isSystem && (
                <button onClick={savePerms} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors">
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
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 bg-sf-surface text-xs cursor-pointer hover:bg-sf-bg transition-colors",
                          selected.isSystem ? "cursor-default" : ""
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={!!editPerms[key]}
                          onChange={() => togglePerm(key)}
                          disabled={selected.isSystem}
                          className="w-3.5 h-3.5 rounded text-primary-500 border-sf-border focus:ring-primary-100"
                        />
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
            プロファイルを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
