"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  prospects: { total: number; active: number; converted: number; optedOut: number; avgScore: number };
  emails: { total: number; sent: number; drafts: number; scheduled: number; totalSent: number; totalOpened: number; totalClicked: number };
}

export default function MAReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ma/prospects/stats").then((r) => r.json()),
      fetch("/api/ma/emails/stats").then((r) => r.json()),
    ]).then(([prospects, emails]) => setStats({ prospects, emails }));
  }, []);

  const openRate = stats && stats.emails.totalSent > 0
    ? ((stats.emails.totalOpened / stats.emails.totalSent) * 100).toFixed(1)
    : "—";
  const clickRate = stats && stats.emails.totalSent > 0
    ? ((stats.emails.totalClicked / stats.emails.totalSent) * 100).toFixed(1)
    : "—";
  const conversionRate = stats && stats.prospects.total > 0
    ? ((stats.prospects.converted / stats.prospects.total) * 100).toFixed(1)
    : "—";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sf-text">MAレポート</h1>
        <p className="text-sm text-sf-weak">マーケティングオートメーションの主要KPIサマリー</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "プロスペクト総数", value: stats?.prospects.total.toLocaleString() ?? "—", sub: `アクティブ ${stats?.prospects.active ?? "—"}`, href: "/ma/prospects" },
          { label: "コンバージョン率", value: `${conversionRate}%`, sub: `${stats?.prospects.converted ?? "—"} 件`, href: "/ma/prospects" },
          { label: "メール開封率", value: `${openRate}%`, sub: `${stats?.emails.totalOpened.toLocaleString() ?? "—"} 件開封`, href: "/ma/emails" },
          { label: "メールクリック率", value: `${clickRate}%`, sub: `${stats?.emails.totalClicked.toLocaleString() ?? "—"} 件クリック`, href: "/ma/emails" },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-500 transition-colors">
            <div className="text-2xl font-bold text-sf-text">{item.value}</div>
            <div className="text-xs font-medium text-sf-text mt-1">{item.label}</div>
            <div className="text-xs text-sf-weak mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* Email Funnel */}
      <div className="bg-sf-surface border border-sf-border rounded-sf p-5">
        <h2 className="text-sm font-semibold text-sf-text mb-4">メールファネル</h2>
        {stats ? (
          <div className="space-y-2">
            {[
              { label: "送信数", value: stats.emails.totalSent, max: stats.emails.totalSent, color: "bg-blue-500" },
              { label: "開封数", value: stats.emails.totalOpened, max: stats.emails.totalSent, color: "bg-green-500" },
              { label: "クリック数", value: stats.emails.totalClicked, max: stats.emails.totalSent, color: "bg-primary-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-sf-weak text-right">{item.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-5 rounded-full ${item.color} transition-all`}
                    style={{ width: item.max > 0 ? `${(item.value / item.max) * 100}%` : "0%" }}
                  />
                </div>
                <div className="w-20 text-xs text-sf-text font-semibold">{item.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sf-weak text-sm">読み込み中...</p>
        )}
      </div>

      {/* Prospect Score Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-4">プロスペクト状態</h2>
          <div className="space-y-3">
            {[
              { label: "アクティブ", value: stats?.prospects.active ?? 0, total: stats?.prospects.total ?? 1, color: "bg-green-500" },
              { label: "コンバート済み", value: stats?.prospects.converted ?? 0, total: stats?.prospects.total ?? 1, color: "bg-blue-500" },
              { label: "オプトアウト", value: stats?.prospects.optedOut ?? 0, total: stats?.prospects.total ?? 1, color: "bg-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-28 text-xs text-sf-weak">{item.label}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-4 rounded-full ${item.color}`}
                    style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : "0%" }} />
                </div>
                <div className="w-12 text-xs text-right font-semibold text-sf-text">{item.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sf-surface border border-sf-border rounded-sf p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-4">メールキャンペーン状況</h2>
          <div className="space-y-2">
            {[
              { label: "合計", value: stats?.emails.total ?? "—" },
              { label: "送信済み", value: stats?.emails.sent ?? "—" },
              { label: "下書き", value: stats?.emails.drafts ?? "—" },
              { label: "スケジュール済み", value: stats?.emails.scheduled ?? "—" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-sf-weak">{item.label}</span>
                <span className="font-semibold text-sf-text">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
