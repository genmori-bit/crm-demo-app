import Link from "next/link";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

const SETTING_SECTIONS = [
  {
    title: "データ管理",
    items: [
      {
        href: "/settings/import",
        label: "データインポート",
        description: "CSVファイルから企業・担当者・商談データを一括インポート",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        ),
      },
      {
        href: "/export?type=company",
        label: "データエクスポート",
        description: "企業・担当者・商談データをCSV形式でダウンロード",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
        isExport: true,
      },
    ],
  },
  {
    title: "データ品質",
    items: [
      {
        href: "/settings/data-quality",
        label: "データ品質チェック",
        description: "未入力項目や不完全なデータを検出して品質を改善",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        href: "/settings/duplicates",
        label: "重複データ検出",
        description: "会社名・メールアドレスの重複データを検出",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "監査・セキュリティ",
    items: [
      {
        href: "/settings/audit-logs",
        label: "監査ログ",
        description: "データの作成・更新・削除の操作履歴を確認",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">設定</h1>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {SETTING_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-sf-weak uppercase tracking-wide mb-3">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 p-4 bg-sf-surface border border-sf-border rounded-sf hover:border-primary-300 hover:bg-primary-50/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-sf bg-primary-50 text-primary-500 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sf-text">{item.label}</p>
                    <p className="text-xs text-sf-weak mt-0.5">{item.description}</p>
                  </div>
                  <svg className="w-4 h-4 text-sf-weak group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <LightningCard>
          <LightningCardHeader title="エクスポート" />
          <LightningCardBody>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "company", label: "企業データ" },
                { type: "contact", label: "担当者データ" },
                { type: "deal", label: "商談データ" },
              ].map((item) => (
                <a
                  key={item.type}
                  href={`/api/export?type=${item.type}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text hover:border-primary-300 hover:text-primary-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {item.label} (CSV)
                </a>
              ))}
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="バージョン情報" />
          <LightningCardBody>
            <p className="text-sm font-semibold text-sf-text">Simple CRM v0.2.0</p>
            <p className="text-xs text-sf-weak mt-1">Next.js · Prisma · PostgreSQL (Neon)</p>
          </LightningCardBody>
        </LightningCard>
      </div>
    </div>
  );
}
