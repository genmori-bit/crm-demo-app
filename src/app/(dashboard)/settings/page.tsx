"use client";

import { useState } from "react";
import Link from "next/link";

interface SettingItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords?: string[];
}

interface SettingSection {
  title: string;
  color: string;
  items: SettingItem[];
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

const SECTIONS: SettingSection[] = [
  {
    title: "ユーザーと権限",
    color: "bg-primary-50 text-primary-600",
    items: [
      { href: "/settings/users", label: "ユーザー管理", description: "ユーザーの招待・編集・無効化を行います", icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />, keywords: ["user", "invite", "招待", "ユーザー"] },
      { href: "/settings/profiles", label: "プロファイル", description: "オブジェクト・フィールドレベルの権限を定義します", icon: <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />, keywords: ["profile", "permission", "権限", "プロファイル"] },
      { href: "/settings/permission-sets", label: "権限セット", description: "プロファイルに追加できる権限のグループです", icon: <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, keywords: ["permission set", "権限セット"] },
      { href: "/settings/roles", label: "ロール", description: "ユーザーの組織階層・データ参照範囲を定義します", icon: <Icon path="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />, keywords: ["role", "ロール", "階層"] },
      { href: "/settings/teams", label: "チーム", description: "ユーザーをチームにグループ化します", icon: <Icon path="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />, keywords: ["team", "チーム", "グループ"] },
      { href: "/settings/app-access", label: "アプリアクセス", description: "ユーザーごとにアプリへのアクセス権を管理します", icon: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />, keywords: ["app", "access", "アプリ", "アクセス"] },
    ],
  },
  {
    title: "セキュリティ",
    color: "bg-warning-light text-warning",
    items: [
      { href: "/settings/security", label: "セキュリティ設定", description: "パスワードポリシー・ロックアウト・セッションタイムアウトを設定します", icon: <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />, keywords: ["security", "password", "セキュリティ", "パスワード", "ロックアウト"] },
      { href: "/settings/login-history", label: "ログイン履歴", description: "全ユーザーのログイン・ログイン失敗の履歴を確認します", icon: <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />, keywords: ["login", "history", "ログイン", "履歴"] },
    ],
  },
  {
    title: "監査・コンプライアンス",
    color: "bg-purple-50 text-purple-600",
    items: [
      { href: "/settings/audit-logs", label: "監査ログ", description: "データの作成・更新・削除の操作履歴を確認します", icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />, keywords: ["audit", "log", "監査", "ログ"] },
    ],
  },
  {
    title: "データ管理",
    color: "bg-teal-50 text-teal-600",
    items: [
      { href: "/settings/import", label: "データインポート", description: "CSVファイルから企業・担当者・商談データを一括インポート", icon: <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />, keywords: ["import", "csv", "インポート"] },
      { href: "/settings/data-quality", label: "データ品質チェック", description: "未入力項目や不完全なデータを検出して品質を改善", icon: <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, keywords: ["data quality", "データ品質"] },
      { href: "/settings/duplicates", label: "重複データ検出", description: "会社名・メールアドレスの重複データを検出・マージ", icon: <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />, keywords: ["duplicate", "重複", "マージ"] },
    ],
  },
  {
    title: "組織設定",
    color: "bg-green-50 text-green-600",
    items: [
      { href: "/settings/org", label: "組織情報", description: "組織名・タイムゾーン・会計年度開始月などを設定します", icon: <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, keywords: ["org", "organization", "組織", "会計年度"] },
      { href: "/settings/my-profile", label: "マイプロファイル", description: "プロフィール・パスワード・通知設定を変更します", icon: <Icon path="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />, keywords: ["my profile", "マイプロファイル", "パスワード"] },
    ],
  },
];

export default function SettingsPage() {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
        ),
      })).filter((s) => s.items.length > 0)
    : SECTIONS;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Setup Home header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">管理</p>
        <h1 className="text-xl font-bold text-sf-text">設定</h1>
      </div>

      {/* Quick Find */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-3">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="クイック検索..."
            className="w-full h-9 pl-9 pr-4 text-sm rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-colors"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sf-weak text-sm">
            「{query}」に一致する設定項目が見つかりませんでした
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            {filtered.map((section) => (
              <div key={section.title}>
                <h2 className="text-xs font-semibold text-sf-weak uppercase tracking-wider mb-3">{section.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 p-3.5 bg-sf-surface border border-sf-border rounded-sf hover:border-primary-300 hover:shadow-card transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-sf flex items-center justify-center shrink-0 ${section.color}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sf-text group-hover:text-primary-600 transition-colors">{item.label}</p>
                        <p className="text-2xs text-sf-weak mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                      <svg className="w-4 h-4 text-sf-weak group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
