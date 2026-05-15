"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ObjectDef {
  id: string;
  label: string;
  labelPlural: string;
  apiName: string;
  description: string | null;
  isCustom: boolean;
  isActive: boolean;
  objectType: string;
  category: string;
  _count: { fields: number; records: number };
}

const STANDARD_OBJECTS = [
  { label: "リード", apiName: "Lead", category: "CRM / MA" },
  { label: "顧客企業", apiName: "Account", category: "CRM" },
  { label: "担当者", apiName: "Contact", category: "CRM" },
  { label: "商談", apiName: "Deal", category: "CRM" },
  { label: "ケース", apiName: "Case", category: "CRM" },
  { label: "キャンペーン", apiName: "Campaign", category: "CRM / MA" },
  { label: "商品", apiName: "Product", category: "CRM" },
  { label: "タスク", apiName: "Task", category: "CRM" },
  { label: "活動", apiName: "Activity", category: "CRM / MA" },
  { label: "見積", apiName: "Quote", category: "CRM" },
  { label: "契約", apiName: "Contract", category: "CRM" },
  { label: "注文", apiName: "Order", category: "CRM" },
  { label: "価格表", apiName: "PriceBook", category: "CRM" },
  { label: "マーケティングメール", apiName: "MarketingEmail", category: "MA" },
  { label: "フォーム", apiName: "MarketingForm", category: "MA" },
  { label: "ランディングページ", apiName: "LandingPage", category: "MA" },
  { label: "Engagement Program", apiName: "EngagementProgram", category: "MA" },
];

export default function ObjectManagerPage() {
  const [customObjects, setCustomObjects] = useState<ObjectDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"standard" | "custom">("standard");

  useEffect(() => {
    setLoading(true);
    fetch("/api/object-manager")
      .then((r) => r.json())
      .then((data) => {
        setCustomObjects(Array.isArray(data) ? data.filter((o: ObjectDef) => o.isCustom) : []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">設定</p>
        <h1 className="text-xl font-bold text-sf-text">オブジェクトマネージャー</h1>
        <p className="text-xs text-sf-weak mt-0.5">標準オブジェクトとカスタムオブジェクトを管理します</p>
      </div>

      <div className="px-6 pt-4 bg-sf-surface border-b border-sf-border flex items-center gap-1">
        {(["standard", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary-500 text-primary-600" : "border-transparent text-sf-weak hover:text-sf-text"}`}
          >
            {t === "standard" ? `標準オブジェクト (${STANDARD_OBJECTS.length})` : "カスタムオブジェクト"}
            {t === "custom" && ` (${customObjects.length})`}
          </button>
        ))}
        {tab === "custom" && (
          <Link
            href="/settings/object-manager/new"
            className="ml-auto mb-2 inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規オブジェクト
          </Link>
        )}
      </div>

      <div className="flex-1 p-6">
        {tab === "standard" ? (
          <div className="grid grid-cols-2 gap-4 max-w-4xl">
            {STANDARD_OBJECTS.map((obj) => (
              <Link
                key={obj.apiName}
                href={`/settings/object-manager/${obj.apiName}`}
                className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">
                  {obj.label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sf-text">{obj.label}</p>
                  <p className="text-2xs text-sf-weak font-mono">{obj.apiName}</p>
                  <p className="text-2xs text-sf-weak">{obj.category}</p>
                </div>
                <svg className="w-4 h-4 text-sf-weak shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-w-4xl">
            {customObjects.length === 0 ? (
              <div className="text-center py-16 bg-sf-surface rounded-sf border border-dashed border-sf-border">
                <p className="text-sf-text font-medium mb-1">カスタムオブジェクトはまだありません</p>
                <p className="text-xs text-sf-weak mb-4">独自のデータ構造を作成できます</p>
                <Link href="/settings/object-manager/new" className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-700">
                  最初のオブジェクトを作成
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {customObjects.map((obj) => (
                  <Link
                    key={obj.id}
                    href={`/settings/object-manager/${obj.apiName}`}
                    className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                        {obj.label[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sf-text">{obj.label}</p>
                        <p className="text-2xs text-sf-weak font-mono">{obj.apiName}</p>
                        {obj.description && <p className="text-xs text-sf-weak mt-1 truncate">{obj.description}</p>}
                      </div>
                      {!obj.isActive && (
                        <span className="text-2xs text-sf-weak bg-sf-bg px-2 py-0.5 rounded-full border border-sf-border">非アクティブ</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-2xs text-sf-weak">
                      <span>{obj._count.fields} フィールド</span>
                      <span>{obj._count.records} レコード</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
