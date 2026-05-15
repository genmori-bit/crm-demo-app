"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

interface Stats {
  leads: { total: number; active: number; converted: number; optedOut: number; avgScore: number };
  emails: { total: number; sent: number; drafts: number; scheduled: number; totalSent: number; totalOpened: number; totalClicked: number };
}

function FunnelBar({ label, value, max, color, href }: { label: string; value: number; max: number; color: string; href?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const content = (
    <div className="flex items-center gap-3 group">
      <span className="w-20 text-xs text-sf-weak text-right shrink-0">{label}</span>
      <div className="flex-1 bg-sf-bg rounded-full h-5 overflow-hidden">
        <div
          className={cn("h-5 rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-2 w-28 shrink-0">
        <span className="text-xs font-bold tabular-nums text-sf-text">{value.toLocaleString()}</span>
        <span className="text-2xs text-sf-weak">({pct.toFixed(1)}%)</span>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-80 transition-opacity">{content}</Link> : content;
}

export default function MAReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ma/leads/stats").then((r) => r.json()),
      fetch("/api/ma/emails/stats").then((r) => r.json()),
    ]).then(([leads, emails]) => setStats({ leads, emails }));
  }, []);

  if (!stats) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-sf-text">MAレポート</h1>
        </div>
        <PageLoading />
      </div>
    );
  }

  const openRate = stats.emails.totalSent > 0 ? (stats.emails.totalOpened / stats.emails.totalSent) * 100 : 0;
  const clickRate = stats.emails.totalSent > 0 ? (stats.emails.totalClicked / stats.emails.totalSent) * 100 : 0;
  const conversionRate = stats.leads.total > 0 ? (stats.leads.converted / stats.leads.total) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <h1 className="text-xl font-bold text-sf-text">MAレポート</h1>
        <p className="text-xs text-sf-weak mt-0.5">マーケティングオートメーション KPI サマリー</p>
      </div>

      <div className="p-6 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="リード総数"
            value={stats.leads.total.toLocaleString()}
            sub={`アクティブ ${stats.leads.active.toLocaleString()}人`}
            accent="primary"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <KpiCard
            label="コンバージョン率"
            value={`${conversionRate.toFixed(1)}%`}
            sub={`${stats.leads.converted.toLocaleString()}件転換`}
            accent={conversionRate >= 10 ? "success" : conversionRate >= 5 ? "warning" : "danger"}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard
            label="メール開封率"
            value={`${openRate.toFixed(1)}%`}
            sub={`${stats.emails.totalOpened.toLocaleString()}件開封`}
            accent={openRate >= 20 ? "success" : openRate >= 10 ? "warning" : "danger"}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          />
          <KpiCard
            label="メールクリック率"
            value={`${clickRate.toFixed(1)}%`}
            sub={`${stats.emails.totalClicked.toLocaleString()}件クリック`}
            accent={clickRate >= 5 ? "success" : clickRate >= 2 ? "warning" : "danger"}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Email funnel */}
          <LightningCard>
            <LightningCardHeader
              title="メールエンゲージメントファネル"
              action={<Link href="/ma/emails" className="text-xs text-primary-500 hover:underline">メール一覧</Link>}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>}
            />
            <LightningCardBody>
              <div className="space-y-3">
                <FunnelBar label="送信数" value={stats.emails.totalSent} max={stats.emails.totalSent} color="bg-primary-400" href="/ma/emails?status=sent" />
                <FunnelBar label="開封数" value={stats.emails.totalOpened} max={stats.emails.totalSent} color="bg-success" />
                <FunnelBar label="クリック数" value={stats.emails.totalClicked} max={stats.emails.totalSent} color="bg-purple-500" />
              </div>
            </LightningCardBody>
          </LightningCard>

          {/* Lead funnel */}
          <LightningCard>
            <LightningCardHeader
              title="リードファネル"
              action={<Link href="/ma/leads" className="text-xs text-primary-500 hover:underline">リード一覧</Link>}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <LightningCardBody>
              <div className="space-y-3">
                <FunnelBar label="総数" value={stats.leads.total} max={stats.leads.total} color="bg-primary-400" href="/ma/leads" />
                <FunnelBar label="アクティブ" value={stats.leads.active} max={stats.leads.total} color="bg-blue-400" href="/ma/leads?status=active" />
                <FunnelBar label="コンバート済み" value={stats.leads.converted} max={stats.leads.total} color="bg-success" href="/ma/leads?status=converted" />
                <FunnelBar label="オプトアウト" value={stats.leads.optedOut} max={stats.leads.total} color="bg-danger/70" href="/ma/leads?optedOut=true" />
              </div>
            </LightningCardBody>
          </LightningCard>
        </div>

        {/* Email campaign summary */}
        <LightningCard>
          <LightningCardHeader
            title="メールキャンペーン状況"
            action={<Link href="/ma/emails" className="text-xs text-primary-500 hover:underline">すべて表示</Link>}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-sf-border border-t border-sf-border">
            {[
              { label: "合計", value: stats.emails.total, href: "/ma/emails" },
              { label: "送信済み", value: stats.emails.sent, href: "/ma/emails?status=sent", color: "text-success" },
              { label: "下書き", value: stats.emails.drafts, href: "/ma/emails?status=draft", color: "text-sf-weak" },
              { label: "スケジュール済み", value: stats.emails.scheduled, href: "/ma/emails?status=scheduled", color: "text-warning" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center py-4 px-3 hover:bg-sf-bg transition-colors"
              >
                <span className={cn("text-2xl font-bold tabular-nums", item.color ?? "text-sf-text")}>{item.value}</span>
                <span className="text-2xs text-sf-weak mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </LightningCard>
      </div>
    </div>
  );
}
