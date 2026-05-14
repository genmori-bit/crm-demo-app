"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

export default function MyProfilePage() {
  const { data: session, update } = useSession();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: session?.user?.name ?? "", currentPassword: "", newPassword: "", confirmPassword: "" });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const saveProfile = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (form.name !== session.user.name) body.name = form.name;
    if (form.newPassword) {
      if (form.newPassword !== form.confirmPassword) {
        showToast("新しいパスワードが一致しません", "error");
        setSaving(false);
        return;
      }
      if (form.newPassword.length < 8) {
        showToast("パスワードは8文字以上にしてください", "error");
        setSaving(false);
        return;
      }
      body.password = form.newPassword;
    }
    if (Object.keys(body).length === 0) { showToast("変更がありません", "error"); setSaving(false); return; }

    const res = await fetch(`/api/settings/users/${session.user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      showToast("プロファイルを更新しました", "success");
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      if (body.name) await update({ name: form.name });
    } else {
      showToast("保存に失敗しました", "error");
    }
  };

  const inputCls = "w-full h-9 px-3 text-xs rounded-sf border border-sf-border bg-sf-surface focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">マイプロファイル</h1>
      </div>

      <div className="flex-1 p-6 max-w-xl space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
            {(session?.user?.name ?? session?.user?.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-sf-text">{session?.user?.name ?? "(名前なし)"}</p>
            <p className="text-xs text-sf-weak">{session?.user?.email}</p>
            <p className="text-2xs text-sf-weak mt-0.5">{session?.user?.role === "ADMIN" ? "管理者" : session?.user?.role === "MANAGER" ? "マネージャー" : "営業"}</p>
          </div>
        </div>

        <LightningCard>
          <LightningCardHeader title="プロファイル情報" />
          <LightningCardBody>
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">表示名</label>
                <input value={form.name} onChange={f("name")} className={inputCls} />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">メールアドレス</label>
                <input value={session?.user?.email ?? ""} disabled className={`${inputCls} bg-sf-bg text-sf-weak cursor-not-allowed`} />
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="パスワード変更" />
          <LightningCardBody>
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">新しいパスワード</label>
                <input type="password" value={form.newPassword} onChange={f("newPassword")} placeholder="8文字以上" className={inputCls} />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">確認用パスワード</label>
                <input type="password" value={form.confirmPassword} onChange={f("confirmPassword")} placeholder="同じパスワードを入力" className={inputCls} />
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <button onClick={saveProfile} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors">
          {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          保存
        </button>
      </div>
    </div>
  );
}
