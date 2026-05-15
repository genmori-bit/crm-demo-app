"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { cn } from "@/lib/utils";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  department: string | null;
  title: string | null;
  phone: string | null;
  timezone: string;
  lastLoginAt: string | null;
  createdAt: string;
  profile: { id: string; name: string } | null;
  permissionSetAssignments: { permissionSet: { id: string; name: string; label: string } }[];
  teamMemberships: { role: string; team: { id: string; name: string } }[];
}

interface Profile { id: string; name: string; }
interface PermissionSet { id: string; name: string; label: string; }

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "有効", dot: "bg-success" },
  PENDING: { label: "招待中", dot: "bg-warning" },
  DISABLED: { label: "無効", dot: "bg-sf-weak" },
  LOCKED: { label: "ロック", dot: "bg-danger" },
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permSets, setPermSets] = useState<PermissionSet[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "SALES", status: "ACTIVE", profileId: "", department: "", title: "", phone: "", newPassword: "" });

  const load = () => {
    Promise.all([
      fetch(`/api/settings/users/${id}`).then((r) => r.json()),
      fetch("/api/settings/profiles").then((r) => r.json()),
      fetch("/api/settings/permission-sets").then((r) => r.json()),
    ]).then(([u, p, ps]) => {
      setUser(u);
      setProfiles(Array.isArray(p) ? p : []);
      setPermSets(Array.isArray(ps) ? ps : []);
      setForm({
        name: u.name ?? "",
        role: u.role,
        status: u.status,
        profileId: u.profile?.id ?? "",
        department: u.department ?? "",
        title: u.title ?? "",
        phone: u.phone ?? "",
        newPassword: "",
      });
    });
  };
  useEffect(load, [id]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const body: Record<string, unknown> = { ...form, profileId: form.profileId || null };
    if (form.newPassword) body.password = form.newPassword;
    delete body.newPassword;

    const res = await fetch(`/api/settings/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { showToast("保存しました", "success"); load(); }
    else showToast("保存に失敗しました", "error");
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <PageLoading />
      </div>
    );
  }

  const status = STATUS_CONFIG[user.status] ?? { label: user.status, dot: "bg-sf-weak" };
  const inputCls = "w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定 / ユーザー管理</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">{user.name ?? user.email}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("inline-flex items-center gap-1 text-2xs", status.dot === "bg-success" ? "text-success" : "text-sf-weak")}>
                <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
              <span className="text-2xs text-sf-weak">·</span>
              <span className="text-2xs text-sf-weak">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Edit form */}
        <div className="lg:col-span-2 space-y-4">
          <LightningCard>
            <LightningCardHeader title="基本情報" />
            <LightningCardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">名前</label>
                  <input value={form.name} onChange={f("name")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">ロール</label>
                  <select value={form.role} onChange={f("role")} className={inputCls}>
                    <option value="SALES">営業</option>
                    <option value="MANAGER">マネージャー</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">ステータス</label>
                  <select value={form.status} onChange={f("status")} className={inputCls}>
                    <option value="ACTIVE">有効</option>
                    <option value="DISABLED">無効</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">プロファイル</label>
                  <select value={form.profileId} onChange={f("profileId")} className={inputCls}>
                    <option value="">なし</option>
                    {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">役職</label>
                  <input value={form.title} onChange={f("title")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">部署</label>
                  <input value={form.department} onChange={f("department")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">電話番号</label>
                  <input value={form.phone} onChange={f("phone")} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-sf-weak mb-1">新しいパスワード（変更する場合のみ）</label>
                  <input type="password" value={form.newPassword} onChange={f("newPassword")} placeholder="8文字以上" className={inputCls} />
                </div>
              </div>
            </LightningCardBody>
          </LightningCard>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors">
              {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              保存
            </button>
            <button onClick={() => router.push("/settings/users")}
              className="px-4 py-2 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors">
              戻る
            </button>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <LightningCard>
            <LightningCardHeader title="権限セット" />
            <LightningCardBody>
              {user.permissionSetAssignments.length === 0 ? (
                <p className="text-xs text-sf-weak text-center py-2">権限セット未割り当て</p>
              ) : (
                <div className="space-y-1.5">
                  {user.permissionSetAssignments.map(({ permissionSet: ps }) => (
                    <div key={ps.id} className="flex items-center justify-between">
                      <span className="text-xs text-sf-text">{ps.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </LightningCardBody>
          </LightningCard>

          <LightningCard>
            <LightningCardHeader title="チーム" />
            <LightningCardBody>
              {user.teamMemberships.length === 0 ? (
                <p className="text-xs text-sf-weak text-center py-2">チーム未所属</p>
              ) : (
                <div className="space-y-1.5">
                  {user.teamMemberships.map(({ team, role }) => (
                    <div key={team.id} className="flex items-center justify-between">
                      <span className="text-xs text-sf-text">{team.name}</span>
                      <span className="text-2xs text-sf-weak">{role === "lead" ? "リード" : "メンバー"}</span>
                    </div>
                  ))}
                </div>
              )}
            </LightningCardBody>
          </LightningCard>

          <LightningCard>
            <LightningCardHeader title="アカウント情報" />
            <LightningCardBody>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-sf-weak">作成日</dt>
                  <dd className="text-sf-text font-medium">{new Date(user.createdAt).toLocaleDateString("ja-JP")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sf-weak">最終ログイン</dt>
                  <dd className="text-sf-text font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("ja-JP") : "—"}</dd>
                </div>
              </dl>
            </LightningCardBody>
          </LightningCard>
        </div>
      </div>
    </div>
  );
}
