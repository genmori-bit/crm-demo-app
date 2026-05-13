"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  prospects: { total: number; active: number; converted: number; optedOut: number; avgScore: number };
  emails: { total: number; sent: number; drafts: number; scheduled: number; totalSent: number; totalOpened: number; totalClicked: number };
}

export default function MAHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ma/prospects/stats").then((r) => r.json()),
      fetch("/api/ma/emails/stats").then((r) => r.json()),
    ]).then(([prospects, emails]) => setStats({ prospects, emails }));
  }, []);

  const openRate = stats && stats.emails.totalSent > 0
    ? Math.round((stats.emails.totalOpened / stats.emails.totalSent) * 100)
    : 0;
  const clickRate = stats && stats.emails.totalSent > 0
    ? Math.round((stats.emails.totalClicked / stats.emails.totalSent) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-sf-text">マーケティングホーム</h1>
        <p className="text-sm text-sf-weak mt-1">プロスペクトとエンゲージメントの概要</p>
      </div>

      {/* Prospect Stats */}
      <section>
        <h2 className="text-sm font-semibold text-sf-weak uppercase tracking-wider mb-3">プロスペクト</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "合計", value: stats?.prospects.total ?? "—", href: "/ma/prospects" },
            { label: "アクティブ", value: stats?.prospects.active ?? "—", href: "/ma/prospects?status=active" },
            { label: "コンバート済み", value: stats?.prospects.converted ?? "—", href: "/ma/prospects?status=converted" },
            { label: "オプトアウト", value: stats?.prospects.optedOut ?? "—", href: "/ma/prospects?optedOut=true" },
            { label: "平均スコア", value: stats?.prospects.avgScore ?? "—", href: "/ma/scoring" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-500 transition-colors"
            >
              <div className="text-2xl font-bold text-sf-text">{item.value}</div>
              <div className="text-xs text-sf-weak mt-1">{item.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Email Stats */}
      <section>
        <h2 className="text-sm font-semibold text-sf-weak uppercase tracking-wider mb-3">メール</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "送信済みメール", value: stats?.emails.sent ?? "—", href: "/ma/emails?status=sent" },
            { label: "合計送信数", value: stats?.emails.totalSent.toLocaleString() ?? "—", href: "/ma/emails" },
            { label: "開封率", value: `${openRate}%`, href: "/ma/reports" },
            { label: "クリック率", value: `${clickRate}%`, href: "/ma/reports" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-500 transition-colors"
            >
              <div className="text-2xl font-bold text-sf-text">{item.value}</div>
              <div className="text-xs text-sf-weak mt-1">{item.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-sf-weak uppercase tracking-wider mb-3">クイックアクション</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "プロスペクト追加", href: "/ma/prospects/new", desc: "新規プロスペクトを手動で追加" },
            { label: "メール作成", href: "/ma/emails/new", desc: "新規メールキャンペーンを作成" },
            { label: "フォーム作成", href: "/ma/forms/new", desc: "リード獲得フォームを作成" },
            { label: "リスト作成", href: "/ma/lists/new", desc: "プロスペクトリストを作成" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-semibold text-primary-600">{item.label}</div>
              <div className="text-xs text-sf-weak mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pipeline Status */}
      <section>
        <h2 className="text-sm font-semibold text-sf-weak uppercase tracking-wider mb-3">メールパイプライン</h2>
        <div className="bg-sf-surface border border-sf-border rounded-sf divide-y divide-sf-border">
          {[
            { label: "下書き", value: stats?.emails.drafts ?? "—", href: "/ma/emails?status=draft", color: "text-sf-weak" },
            { label: "スケジュール済み", value: stats?.emails.scheduled ?? "—", href: "/ma/emails?status=scheduled", color: "text-yellow-600" },
            { label: "送信済み", value: stats?.emails.sent ?? "—", href: "/ma/emails?status=sent", color: "text-green-600" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-sf-text">{item.label}</span>
              <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
