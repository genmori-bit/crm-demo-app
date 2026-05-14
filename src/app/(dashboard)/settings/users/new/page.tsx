"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

interface Profile {
  id: string;
  name: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const showToast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES",
    profileId: "",
    department: "",
    title: "",
  });

  useEffect(() => {
    fetch("/api/settings/profiles").then((r) => r.json()).then((data) => setProfiles(Array.isArray(data) ? data : []));
  }, []);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("名前とメールアドレスは必須です", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, profileId: form.profileId || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("ユーザーを作成しました", "success");
      router.push("/settings/users");
    } else {
      const data = await res.json();
      showToast(data.error ?? "作成に失敗しました", "error");
    }
  };

  const inputCls = "w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定 / ユーザー管理</p>
        <h1 className="text-xl font-bold text-sf-text">新規ユーザー</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <LightningCard>
          <LightningCardHeader title="ユーザー情報" />
          <LightningCardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-sf-weak mb-1">名前 *</label>
                <input value={form.name} onChange={f("name")} placeholder="山田 太郎" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-2xs font-semibold text-sf-weak mb-1">メールアドレス *</label>
                <input type="email" value={form.email} onChange={f("email")} placeholder="taro@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">初期パスワード</label>
                <input type="password" value={form.password} onChange={f("password")} placeholder="空白の場合はランダム生成" className={inputCls} />
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
                <label className="block text-2xs font-semibold text-sf-weak mb-1">プロファイル</label>
                <select value={form.profileId} onChange={f("profileId")} className={inputCls}>
                  <option value="">なし</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">役職</label>
                <input value={form.title} onChange={f("title")} placeholder="営業担当" className={inputCls} />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">部署</label>
                <input value={form.department} onChange={f("department")} placeholder="営業部" className={inputCls} />
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <div className="flex gap-2 mt-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            保存
          </button>
          <button
            onClick={() => router.push("/settings/users")}
            className="px-4 py-2 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
