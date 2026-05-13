"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface DuplicateGroup {
  type: string;
  reason: string;
  items: { id: string; name: string; href: string }[];
}

const TYPE_LABELS: Record<string, string> = {
  company: "企業",
  contact: "担当者",
};

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);

  useEffect(() => {
    api.get<DuplicateGroup[]>("/api/duplicates").then(setGroups);
  }, []);

  if (!groups) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">重複データ検出</h1>
      </div>

      <div className="p-6 space-y-4 max-w-4xl">
        {groups.length === 0 ? (
          <LightningCard>
            <LightningCardBody>
              <div className="py-8 text-center">
                <svg className="w-12 h-12 text-success mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-sf-text">重複データは検出されませんでした</p>
                <p className="text-xs text-sf-weak mt-1">会社名とメールアドレスで重複チェックを行いました</p>
              </div>
            </LightningCardBody>
          </LightningCard>
        ) : (
          <>
            <div className="bg-warning/10 border border-warning/30 rounded-sf px-4 py-3">
              <p className="text-sm font-medium text-warning">{groups.length}件の重複候補が見つかりました</p>
              <p className="text-xs text-sf-weak mt-0.5">各グループを確認し、必要に応じてデータを統合または修正してください</p>
            </div>

            {groups.map((group, i) => (
              <LightningCard key={i}>
                <LightningCardHeader
                  title={`${TYPE_LABELS[group.type] ?? group.type}: ${group.reason}`}
                  icon={
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      group.type === "company" ? "bg-primary-50 text-primary-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {group.items.length}件
                    </span>
                  }
                />
                <LightningCardBody noPadding>
                  <ul className="divide-y divide-sf-border">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-sf-text font-medium">{item.name}</span>
                        <Link href={item.href} className="text-xs text-primary-500 hover:underline">詳細</Link>
                      </li>
                    ))}
                  </ul>
                </LightningCardBody>
              </LightningCard>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
