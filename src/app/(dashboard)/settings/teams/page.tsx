"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

interface TeamMember {
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
  members: TeamMember[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function TeamsPage() {
  const showToast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [addUserId, setAddUserId] = useState("");

  const load = () => {
    Promise.all([
      fetch("/api/settings/teams").then((r) => r.json()),
      fetch("/api/settings/users").then((r) => r.json()),
    ]).then(([t, u]) => {
      const arr = Array.isArray(t) ? t : [];
      setTeams(arr);
      setUsers(Array.isArray(u) ? u : []);
      if (selected) {
        const updated = arr.find((team: Team) => team.id === selected.id);
        if (updated) setSelected(updated);
      }
    });
  };
  useEffect(load, []);

  const create = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/settings/teams", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) { showToast("チームを作成しました", "success"); setShowNew(false); setNewName(""); load(); }
  };

  const addMember = async (teamId: string) => {
    if (!addUserId) return;
    const res = await fetch(`/api/settings/teams/${teamId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", userId: addUserId, role: "member" }),
    });
    if (res.ok) { showToast("メンバーを追加しました", "success"); setAddUserId(""); load(); }
  };

  const removeMember = async (teamId: string, userId: string) => {
    const res = await fetch(`/api/settings/teams/${teamId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", userId }),
    });
    if (res.ok) { showToast("メンバーを削除しました", "success"); load(); }
  };

  const deleteTeam = async (id: string) => {
    const res = await fetch(`/api/settings/teams/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("削除しました", "success"); setSelected(null); load(); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs text-sf-weak">設定</p>
            <h1 className="text-xl font-bold text-sf-text">チーム</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規チーム
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Team list */}
        <div className="space-y-3">
          {showNew && (
            <LightningCard>
              <LightningCardBody>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setShowNew(false); }}
                  placeholder="チーム名..."
                  className="w-full h-9 px-3 text-xs rounded-sf border border-sf-border focus:outline-none focus:ring-2 focus:ring-primary-100 mb-2" />
                <div className="flex gap-2">
                  <button onClick={create} className="flex-1 py-1.5 text-2xs font-medium bg-primary-500 text-white rounded-sf">作成</button>
                  <button onClick={() => setShowNew(false)} className="flex-1 py-1.5 text-2xs border border-sf-border rounded-sf hover:bg-sf-bg">キャンセル</button>
                </div>
              </LightningCardBody>
            </LightningCard>
          )}
          {teams.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-full text-left p-3.5 bg-sf-surface border rounded-sf hover:border-primary-300 transition-all ${selected?.id === t.id ? "border-primary-400 bg-primary-50" : "border-sf-border"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sf-text">{t.name}</span>
                <span className="text-2xs text-sf-weak">{t._count.members}人</span>
              </div>
              {t.description && <p className="text-2xs text-sf-weak mt-0.5">{t.description}</p>}
            </button>
          ))}
          {teams.length === 0 && !showNew && (
            <p className="text-xs text-sf-weak text-center py-8">チームがありません</p>
          )}
        </div>

        {/* Team detail */}
        {selected ? (
          <div className="md:col-span-2 space-y-4">
            <LightningCard>
              <LightningCardHeader
                title={selected.name}
                action={
                  <button onClick={() => deleteTeam(selected.id)} className="text-2xs text-danger hover:underline">削除</button>
                }
              />
              <LightningCardBody>
                <div className="flex gap-2 mb-4">
                  <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)}
                    className="flex-1 h-8 px-2 text-xs rounded-sf border border-sf-border focus:outline-none focus:ring-2 focus:ring-primary-100">
                    <option value="">メンバーを追加...</option>
                    {users.filter((u) => !selected.members.some((m) => m.user.id === u.id)).map((u) => (
                      <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                    ))}
                  </select>
                  <button onClick={() => addMember(selected.id)} disabled={!addUserId}
                    className="px-3 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-40 h-8">
                    追加
                  </button>
                </div>

                {selected.members.length === 0 ? (
                  <p className="text-xs text-sf-weak text-center py-4">メンバーがいません</p>
                ) : (
                  <div className="divide-y divide-sf-border">
                    {selected.members.map(({ user, role }) => (
                      <div key={user.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xs font-bold">
                            {(user.name ?? user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-sf-text">{user.name ?? user.email}</p>
                            <p className="text-2xs text-sf-weak">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xs text-sf-weak">{role === "lead" ? "リード" : "メンバー"}</span>
                          <button onClick={() => removeMember(selected.id, user.id)} className="text-2xs text-danger hover:underline">削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </LightningCardBody>
            </LightningCard>
          </div>
        ) : (
          <div className="md:col-span-2 flex items-center justify-center text-xs text-sf-weak py-20">
            チームを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
