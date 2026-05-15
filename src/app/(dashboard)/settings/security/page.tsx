"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

interface SecuritySettings {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMins: number;
  sessionTimeoutMins: number;
  mfaRequired: boolean;
}

export default function SecurityPage() {
  const showToast = useToast();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [form, setForm] = useState<SecuritySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/security").then((r) => r.json()).then((data) => {
      setSettings(data);
      setForm(data);
    });
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const res = await fetch("/api/settings/security", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { showToast("セキュリティ設定を保存しました", "success"); setSettings(form); }
    else showToast("保存に失敗しました", "error");
  };

  const n = (k: keyof SecuritySettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => p ? { ...p, [k]: Number(e.target.value) } : p);

  const b = (k: keyof SecuritySettings) => () =>
    setForm((p) => p ? { ...p, [k]: !(p[k] as boolean) } : p);

  if (!form) {
    return <PageLoading />;
  }

  const inputCls = "h-9 w-24 px-3 text-xs rounded-sf border border-sf-border bg-sf-surface focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${checked ? "bg-success" : "bg-sf-border"}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">セキュリティ設定</h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl space-y-5">
        <LightningCard>
          <LightningCardHeader title="パスワードポリシー" icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          } />
          <LightningCardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sf-text">最低文字数</p>
                  <p className="text-2xs text-sf-weak">パスワードの最低文字数</p>
                </div>
                <input type="number" min={6} max={32} value={form.minPasswordLength} onChange={n("minPasswordLength")} className={inputCls} />
              </div>
              {([
                ["requireUppercase", "大文字を必須にする"],
                ["requireNumbers", "数字を必須にする"],
                ["requireSymbols", "記号を必須にする"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-xs font-medium text-sf-text">{label}</p>
                  <Toggle checked={form[key]} onChange={b(key)} />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sf-text">パスワード有効期限（日）</p>
                  <p className="text-2xs text-sf-weak">0 = 無期限</p>
                </div>
                <input type="number" min={0} max={365} value={form.passwordExpiryDays} onChange={n("passwordExpiryDays")} className={inputCls} />
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="ログイン・セッション" icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          } />
          <LightningCardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sf-text">最大ログイン試行回数</p>
                  <p className="text-2xs text-sf-weak">超過するとアカウントをロック</p>
                </div>
                <input type="number" min={1} max={20} value={form.maxLoginAttempts} onChange={n("maxLoginAttempts")} className={inputCls} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sf-text">ロックアウト期間（分）</p>
                </div>
                <input type="number" min={1} max={1440} value={form.lockoutDurationMins} onChange={n("lockoutDurationMins")} className={inputCls} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sf-text">セッションタイムアウト（分）</p>
                  <p className="text-2xs text-sf-weak">480 = 8時間</p>
                </div>
                <input type="number" min={5} max={43200} value={form.sessionTimeoutMins} onChange={n("sessionTimeoutMins")} className={inputCls} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-sf-text">MFA必須</p>
                <Toggle checked={form.mfaRequired} onChange={b("mfaRequired")} />
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors">
          {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          設定を保存
        </button>
      </div>
    </div>
  );
}
