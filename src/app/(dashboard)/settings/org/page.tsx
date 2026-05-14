"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

interface OrgSettings {
  orgName: string;
  orgTimezone: string;
  orgLocale: string;
  fiscalMonth: number;
  dateFormat: string;
  currency: string;
}

const TIMEZONES = ["Asia/Tokyo", "Asia/Seoul", "Asia/Shanghai", "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "UTC"];
const CURRENCIES = ["JPY", "USD", "EUR", "GBP", "CNY", "KRW"];

export default function OrgPage() {
  const showToast = useToast();
  const [form, setForm] = useState<OrgSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/org").then((r) => r.json()).then(setForm);
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const res = await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) showToast("組織設定を保存しました", "success");
    else showToast("保存に失敗しました", "error");
  };

  const f = (k: keyof OrgSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => p ? { ...p, [k]: k === "fiscalMonth" ? Number(e.target.value) : e.target.value } : p);

  if (!form) {
    return <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const inputCls = "w-full h-9 px-3 text-xs rounded-sf border border-sf-border bg-sf-surface focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">組織情報</h1>
      </div>

      <div className="flex-1 p-6 max-w-xl space-y-5">
        <LightningCard>
          <LightningCardHeader title="基本情報" />
          <LightningCardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">組織名</label>
                <input value={form.orgName} onChange={f("orgName")} className={inputCls} />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">タイムゾーン</label>
                <select value={form.orgTimezone} onChange={f("orgTimezone")} className={inputCls}>
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">言語</label>
                <select value={form.orgLocale} onChange={f("orgLocale")} className={inputCls}>
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="会計・表示設定" />
          <LightningCardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">会計年度開始月</label>
                <select value={form.fiscalMonth} onChange={f("fiscalMonth")} className={inputCls}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">日付フォーマット</label>
                <select value={form.dateFormat} onChange={f("dateFormat")} className={inputCls}>
                  <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-sf-weak mb-1">通貨</label>
                <select value={form.currency} onChange={f("currency")} className={inputCls}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors">
          {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          保存
        </button>
      </div>
    </div>
  );
}
