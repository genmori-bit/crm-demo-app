"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { ObjectIcon } from "@/components/ui/object-icon";

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
  icon: string | null;
  color: string | null;
  _count: { fields: number; records: number };
}

const STANDARD_OBJECTS = [
  { label: "リード",                   apiName: "Lead",              category: "CRM / MA" },
  { label: "顧客企業",                 apiName: "Company",           category: "CRM" },
  { label: "担当者",                   apiName: "Contact",           category: "CRM" },
  { label: "商談",                     apiName: "Deal",              category: "CRM" },
  { label: "ケース",                   apiName: "Case",              category: "CRM" },
  { label: "キャンペーン",             apiName: "Campaign",          category: "CRM / MA" },
  { label: "商品",                     apiName: "Product",           category: "CRM" },
  { label: "タスク",                   apiName: "Task",              category: "CRM" },
  { label: "活動",                     apiName: "Activity",          category: "CRM / MA" },
  { label: "見積",                     apiName: "Quote",             category: "CRM" },
  { label: "契約",                     apiName: "Contract",          category: "CRM" },
  { label: "注文",                     apiName: "Order",             category: "CRM" },
  { label: "価格表",                   apiName: "PriceBook",         category: "CRM" },
  { label: "マーケティングメール",     apiName: "MarketingEmail",    category: "MA" },
  { label: "フォーム",                 apiName: "MarketingForm",     category: "MA" },
  { label: "ランディングページ",       apiName: "LandingPage",       category: "MA" },
  { label: "Engagement Program",       apiName: "EngagementProgram", category: "MA" },
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
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak font-medium uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">オブジェクトマネージャー</h1>
        <p className="text-xs text-sf-weak mt-0.5">標準オブジェクトとカスタムオブジェクトを管理します</p>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-sf-surface border-b border-sf-border flex items-center gap-1">
        {(["standard", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-sf-weak hover:text-sf-text"
            }`}
          >
            {t === "standard"
              ? `標準オブジェクト (${STANDARD_OBJECTS.length})`
              : `カスタムオブジェクト (${customObjects.length})`}
          </button>
        ))}
        {tab === "custom" && (
          <Link
            href="/settings/object-manager/new"
            className="ml-auto my-2 inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            新規オブジェクト
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {tab === "standard" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl">
            {STANDARD_OBJECTS.map((obj) => (
              <Link
                key={obj.apiName}
                href={`/settings/object-manager/${obj.apiName}`}
                className="bg-sf-surface rounded-sf border border-sf-border p-4 hover:border-primary-300 hover:shadow-sm transition-all flex items-center gap-3 group"
              >
                <ObjectIcon objectType={obj.apiName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sf-text">{obj.label}</p>
                  <p className="text-2xs text-sf-weak font-mono mt-0.5">{obj.apiName}</p>
                  <p className="text-2xs text-sf-weak">{obj.category}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-sf-weak shrink-0 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
              </Link>
            ))}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : (
          <div className="max-w-4xl">
            {customObjects.length === 0 ? (
              <div className="text-center py-20 bg-sf-surface rounded-sf border border-dashed border-sf-border">
                <div className="w-12 h-12 rounded-xl bg-sf-bg border border-sf-border flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-sf-weak" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-sf-text mb-1">カスタムオブジェクトはまだありません</p>
                <p className="text-xs text-sf-weak mb-4">独自のデータ構造を作成できます</p>
                <Link
                  href="/settings/object-manager/new"
                  className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  最初のオブジェクトを作成
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customObjects.map((obj) => (
                  <Link
                    key={obj.id}
                    href={`/settings/object-manager/${obj.apiName}`}
                    className="bg-sf-surface rounded-sf border border-sf-border p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ObjectIcon
                        iconId={obj.icon ?? "briefcase"}
                        color={obj.color ?? "#4f46e5"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-sf-text">{obj.label}</p>
                          {!obj.isActive && (
                            <span className="text-2xs text-sf-weak bg-sf-bg px-1.5 py-0.5 rounded border border-sf-border">
                              非アクティブ
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-sf-weak font-mono mt-0.5">{obj.apiName}</p>
                        {obj.description && (
                          <p className="text-xs text-sf-weak mt-0.5 truncate">{obj.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-sf-weak shrink-0 group-hover:text-primary-500 transition-colors" strokeWidth={2} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-2xs text-sf-weak pl-11">
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
