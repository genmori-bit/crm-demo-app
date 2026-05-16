"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { CueCard } from "@/components/ui/cue-card";
import { PageLoading } from "@/components/ui/loading";
import { DonutChart } from "@/components/ui/simple-chart";

interface Stats {
  leads: {
    total: number;
    active: number;
    converted: number;
    optedOut: number;
    avgScore: number;
  };
  emails: {
    total: number;
    sent: number;
    drafts: number;
    scheduled: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  };
}

const GRADE_COLORS: Record<string, string> = {
  A: "#2e844a",
  B: "#0176d3",
  C: "#dd7a01",
  D: "#706e6b",
};

export default function MAHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ma/leads/stats").then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch("/api/ma/emails/stats").then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([leads, emails]) => setStats({ leads, emails }))
      .catch(() => {
        // Show empty stats on error rather than infinite loading
        setStats({
          leads: { total: 0, active: 0, converted: 0, optedOut: 0, avgScore: 0 },
          emails: { total: 0, sent: 0, drafts: 0, scheduled: 0, totalSent: 0, totalOpened: 0, totalClicked: 0 },
        });
      });
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const openRate =
    stats && stats.emails.totalSent > 0
      ? Math.round((stats.emails.totalOpened / stats.emails.totalSent) * 100)
      : 0;
  const clickRate =
    stats && stats.emails.totalSent > 0
      ? Math.round((stats.emails.totalClicked / stats.emails.totalSent) * 100)
      : 0;

  const leadStatusData = stats
    ? [
        { label: "アクティブ", value: stats.leads.active, color: "#0176d3" },
        { label: "コンバート済み", value: stats.leads.converted, color: "#2e844a" },
        { label: "オプトアウト", value: stats.leads.optedOut, color: "#706e6b" },
        {
          label: "その他",
          value: Math.max(
            0,
            stats.leads.total - stats.leads.active - stats.leads.converted - stats.leads.optedOut
          ),
          color: "#dd7a01",
        },
      ].filter((d) => d.value > 0)
    : [];

  if (!stats) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-sf-text">マーケティングホーム</h1>
        </div>
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">マーケティングホーム</h1>
            <p className="text-xs text-sf-weak mt-0.5">{dateLabel} · リードとエンゲージメントの概要</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ma/leads/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規リード
            </Link>
            <Link
              href="/ma/emails/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              メール作成
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-5">
        {/* KPI section */}
        <div className="space-y-2.5">
          {/* Primary metrics */}
          <MetricGrid cols={4}>
            <MetricCard
              label="リード数"
              value={`${stats.leads.total}人`}
              subValue={`アクティブ ${stats.leads.active}人`}
              tone="brand"
              emphasis="high"
              href="/ma/leads"
            />
            <MetricCard
              label="コンバート済み"
              value={`${stats.leads.converted}人`}
              subValue={
                stats.leads.total > 0
                  ? `転換率 ${Math.round((stats.leads.converted / stats.leads.total) * 100)}%`
                  : "—"
              }
              tone="success"
              emphasis="high"
              href="/ma/leads"
            />
            <MetricCard
              label="開封率"
              value={`${openRate}%`}
              subValue="ユニーク開封"
              tone={openRate >= 20 ? "success" : openRate >= 10 ? "warning" : "danger"}
              status={openRate < 10 ? { label: "低開封率", tone: "danger" } : undefined}
              emphasis="medium"
              href="/ma/reports"
            />
            <MetricCard
              label="クリック率"
              value={`${clickRate}%`}
              subValue="ユニーククリック"
              tone={clickRate >= 5 ? "success" : clickRate >= 2 ? "warning" : "danger"}
              emphasis="medium"
              href="/ma/reports"
            />
          </MetricGrid>
          {/* Secondary metrics */}
          <div className="flex gap-3">
            <MetricCard
              label="メール送信数"
              value={new Intl.NumberFormat("ja-JP").format(stats.emails.totalSent)}
              subValue={`直近 ${stats.emails.sent}件`}
              tone="neutral"
              emphasis="low"
              href="/ma/emails"
              className="flex-1"
            />
            <MetricCard
              label="平均スコア"
              value={stats.leads.avgScore ?? "—"}
              subValue="スコアリング集計"
              tone="neutral"
              emphasis="low"
              href="/ma/scoring"
              className="flex-1"
            />
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick actions as cue cards */}
            <LightningCard>
              <LightningCardHeader
                title="クイックアクション"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <LightningCardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CueCard
                    title="新規リード"
                    description="新規リードを手動で登録します"
                    href="/ma/leads/new"
                    accent="primary"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    }
                  />
                  <CueCard
                    title="メールキャンペーン作成"
                    description="新規メールを作成してリストに配信します"
                    href="/ma/emails/new"
                    accent="primary"
                    badge={stats.emails.drafts > 0 ? `下書き ${stats.emails.drafts}件` : undefined}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                  <CueCard
                    title="フォーム作成"
                    description="リード獲得フォームを作成・公開します"
                    href="/ma/forms/new"
                    accent="success"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  />
                  <CueCard
                    title="リストを作成"
                    description="セグメント別にリストを作成して管理します"
                    href="/ma/lists/new"
                    accent="success"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    }
                  />
                  <CueCard
                    title="オートメーションルール設定"
                    description="条件に応じた自動アクションを設定します"
                    href="/ma/automation-rules"
                    accent="warning"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    }
                  />
                  <CueCard
                    title="エンゲージメントプログラム"
                    description="ナーチャリングフローを作成・管理します"
                    href="/ma/engagement-programs"
                    accent="warning"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    }
                  />
                </div>
              </LightningCardBody>
            </LightningCard>

            {/* Email pipeline */}
            <LightningCard>
              <LightningCardHeader
                title="メールパイプライン"
                action={
                  <Link href="/ma/emails" className="text-xs text-primary-500 hover:underline">
                    メール一覧
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <div className="divide-y divide-sf-border">
                {[
                  {
                    label: "下書き",
                    value: stats.emails.drafts,
                    href: "/ma/emails?status=draft",
                    dot: "bg-sf-weak",
                    textColor: "text-sf-text",
                  },
                  {
                    label: "スケジュール済み",
                    value: stats.emails.scheduled,
                    href: "/ma/emails?status=scheduled",
                    dot: "bg-warning",
                    textColor: "text-warning",
                  },
                  {
                    label: "送信済み",
                    value: stats.emails.sent,
                    href: "/ma/emails?status=sent",
                    dot: "bg-success",
                    textColor: "text-success",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-sf-bg transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <span className="text-sm text-sf-text">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold tabular-nums ${item.textColor}`}>{item.value}件</span>
                      <svg className="w-3.5 h-3.5 text-sf-weak group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </LightningCard>
          </div>

          {/* Right sidebar (1/3) */}
          <div className="space-y-5">
            {/* Prospect status donut */}
            <LightningCard>
              <LightningCardHeader
                title="リードステータス"
                action={
                  <Link href="/ma/leads" className="text-xs text-primary-500 hover:underline">
                    一覧
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <LightningCardBody>
                {leadStatusData.length === 0 ? (
                  <p className="text-sm text-sf-weak text-center py-4">データがありません</p>
                ) : (
                  <DonutChart data={leadStatusData} size={110} centerLabel="人" />
                )}
              </LightningCardBody>
            </LightningCard>

            {/* Reports nav */}
            <LightningCard>
              <LightningCardHeader
                title="レポート"
                action={
                  <Link href="/ma/reports" className="text-xs text-primary-500 hover:underline">
                    すべて表示
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <div className="divide-y divide-sf-border">
                {[
                  { label: "メールパフォーマンス", href: "/ma/reports" },
                  { label: "リードスコアリング", href: "/ma/scoring" },
                  { label: "フォーム提出レポート", href: "/ma/forms" },
                  { label: "エンゲージメント分析", href: "/ma/engagement-programs" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-sf-bg transition-colors group"
                  >
                    <span className="text-xs text-sf-text group-hover:text-primary-600 transition-colors">{item.label}</span>
                    <svg className="w-3.5 h-3.5 text-sf-weak group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </LightningCard>
          </div>
        </div>
      </div>
    </div>
  );
}
