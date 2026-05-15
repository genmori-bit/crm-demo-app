"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { KpiCard } from "@/components/ui/kpi-card";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { HorizontalBarChart, DonutChart } from "@/components/ui/simple-chart";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { DealStageBadge, TaskPriorityBadge } from "@/components/ui/status-badges";
import { PageLoading } from "@/components/ui/loading";
import { formatAmount, formatDate, isOverdue } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardData {
  companyCount: number;
  contactCount: number;
  activeDealsCount: number;
  activeDealsAmount: number;
  expectedRevenue: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  closingThisMonth: Array<{
    id: string;
    dealName: string;
    amount: number;
    probability: number;
    expectedCloseDate: string;
    stage: string;
    company: { companyName: string };
  }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    status: string;
    company: { companyName: string } | null;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    subject: string;
    body?: string | null;
    activityDate: string;
    company: { id: string; companyName: string } | null;
    contact: { id: string; fullName: string } | null;
    deal: { id: string; dealName: string } | null;
  }>;
  dealsByStage: Array<{
    stage: string;
    _count: { id: number };
    _sum: { amount: number | null };
  }>;
  companyStatusCounts: Record<string, number>;
}

const STAGE_COLORS: Record<string, string> = {
  lead: "#706e6b",
  hearing: "#0176d3",
  proposal: "#dd7a01",
  negotiation: "#9050e9",
  won: "#2e844a",
  lost: "#ba0517",
};

const COMPANY_STATUS_COLORS: Record<string, string> = {
  prospect: "#0176d3",
  active: "#2e844a",
  negotiating: "#9050e9",
  dormant: "#706e6b",
};

const COMPANY_STATUS_LABELS: Record<string, string> = {
  prospect: "見込み",
  active: "既存顧客",
  negotiating: "商談中",
  dormant: "休眠",
};

function ProbabilityDot({ value }: { value: number }) {
  const color =
    value >= 75 ? "bg-success" :
    value >= 50 ? "bg-primary-500" :
    value >= 25 ? "bg-warning" :
    "bg-sf-weak";
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", color)} />
  );
}

function TodayBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const isToday = dueDate.slice(0, 10) === today;
  const overdue = isOverdue(dueDate);
  if (overdue) return (
    <span className="text-2xs bg-danger/10 text-danger font-semibold px-1.5 py-0.5 rounded">期限超過</span>
  );
  if (isToday) return (
    <span className="text-2xs bg-warning/15 text-warning font-semibold px-1.5 py-0.5 rounded">今日</span>
  );
  return null;
}

export default function DashboardPage() {
  const showToast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
      showToast(newStatus === "done" ? "タスクを完了にしました" : "タスクを未着手に戻しました");
      load();
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
          <div className="h-6 skeleton w-32 mb-1" />
          <div className="h-3.5 skeleton w-56" />
        </div>
        <div className="p-6 flex-1 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-4 space-y-3 animate-in">
                <div className="h-3.5 skeleton w-1/2" />
                <div className="h-7 skeleton w-3/4" />
                <div className="h-3 skeleton w-2/3" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">
              <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card h-48 animate-in" />
              <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card h-64 animate-in" />
            </div>
            <div className="space-y-4">
              <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card h-40 animate-in" />
              <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card h-56 animate-in" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stageAmountData = (["lead", "hearing", "proposal", "negotiation"] as const).map((stage) => {
    const s = data.dealsByStage.find((d) => d.stage === stage);
    return {
      label: DEAL_STAGE_LABELS[stage],
      value: s?._sum.amount ?? 0,
      count: s?._count.id ?? 0,
      color: STAGE_COLORS[stage],
    };
  });

  const companyStatusData = Object.entries(data.companyStatusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      label: COMPANY_STATUS_LABELS[status] ?? status,
      value: count,
      color: COMPANY_STATUS_COLORS[status] ?? "#706e6b",
    }));

  const urgentTasks = data.pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return t.dueDate.slice(0, 10) <= today;
  });

  const upcomingTasks = data.pendingTasks.filter((t) => {
    if (!t.dueDate) return true;
    const today = new Date().toISOString().slice(0, 10);
    return t.dueDate.slice(0, 10) > today;
  }).slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Page header ────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">ダッシュボード</h1>
            <p className="text-xs text-sf-weak mt-0.5">{dateLabel} · セールスパイプラインの概要</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/activities/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              活動記録
            </Link>
            <Link
              href="/deals/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規商談
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-5">
        {/* ── KPI row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="進行中商談"
            value={`${data.activeDealsCount}件`}
            sub={formatAmount(data.activeDealsAmount)}
            accent="primary"
            href="/deals?view=active"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <KpiCard
            label="受注見込み"
            value={formatAmount(data.expectedRevenue)}
            sub="確度加重"
            accent="success"
            href="/deals"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            label="未完了タスク"
            value={`${data.pendingTasksCount}件`}
            sub={data.overdueTasksCount > 0 ? `期限超過 ${data.overdueTasksCount}件` : "期限切れなし"}
            accent={data.overdueTasksCount > 0 ? "danger" : "default"}
            href="/tasks"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <KpiCard
            label="今月クローズ"
            value={`${data.closingThisMonth.length}件`}
            sub={formatAmount(data.closingThisMonth.reduce((s, d) => s + d.amount, 0))}
            accent="warning"
            href="/deals"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <KpiCard
            label="顧客企業数"
            value={`${data.companyCount}社`}
            accent="default"
            href="/companies"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <KpiCard
            label="担当者数"
            value={`${data.contactCount}人`}
            accent="default"
            href="/contacts"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>

        {/* ── 2-column main area ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left column (2/3) ────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pipeline chart */}
            <LightningCard>
              <LightningCardHeader
                title="ステージ別パイプライン"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                action={
                  <Link href="/deals" className="text-xs text-primary-500 hover:underline">
                    商談一覧
                  </Link>
                }
              />
              <LightningCardBody>
                {stageAmountData.every((d) => d.value === 0) ? (
                  <p className="text-sm text-sf-weak text-center py-4">進行中の商談がありません</p>
                ) : (
                  <HorizontalBarChart data={stageAmountData} />
                )}
              </LightningCardBody>
            </LightningCard>

            {/* Closing this month */}
            <LightningCard>
              <LightningCardHeader
                title="今月クローズ予定"
                action={
                  <Link href="/deals" className="text-xs text-primary-500 hover:underline">
                    すべて表示
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              {data.closingThisMonth.length === 0 ? (
                <LightningCardBody>
                  <p className="text-sm text-sf-weak text-center py-4">今月クローズ予定の商談はありません</p>
                </LightningCardBody>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sf-border bg-sf-bg">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">商談名</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">ステージ</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak">金額</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak">確度</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak">クローズ予定</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sf-border">
                        {data.closingThisMonth.map((deal) => (
                          <tr key={deal.id} className="hover:bg-sf-bg transition-colors">
                            <td className="px-4 py-2.5">
                              <Link href={`/deals/${deal.id}`} className="font-medium text-primary-500 hover:underline text-xs">
                                {deal.dealName}
                              </Link>
                              <p className="text-2xs text-sf-weak mt-0.5">{deal.company.companyName}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <DealStageBadge stage={deal.stage} />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-xs font-bold text-sf-text tabular-nums">{formatAmount(deal.amount)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <ProbabilityDot value={deal.probability} />
                                <span className="text-xs text-sf-text tabular-nums">{deal.probability}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="text-xs text-sf-weak tabular-nums">{formatDate(deal.expectedCloseDate)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-sf-border bg-sf-bg/50 flex items-center justify-between">
                    <span className="text-xs text-sf-weak">{data.closingThisMonth.length}件</span>
                    <span className="text-xs font-bold text-sf-text tabular-nums">
                      {formatAmount(data.closingThisMonth.reduce((s, d) => s + d.amount, 0))}
                    </span>
                  </div>
                </>
              )}
            </LightningCard>

            {/* Recent activities */}
            <LightningCard>
              <LightningCardHeader
                title="最近の活動"
                action={
                  <Link href="/activities" className="text-xs text-primary-500 hover:underline">
                    すべて表示
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <ActivityTimeline activities={data.recentActivities.slice(0, 6)} />
            </LightningCard>
          </div>

          {/* ── Right sidebar (1/3) ──────────────── */}
          <div className="space-y-5">
            {/* Today's actions */}
            <LightningCard>
              <LightningCardHeader
                title="今日のアクション"
                action={
                  <Link href="/tasks" className="text-xs text-primary-500 hover:underline">
                    タスク一覧
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
              {urgentTasks.length === 0 && upcomingTasks.length === 0 ? (
                <LightningCardBody>
                  <div className="flex flex-col items-center py-6 gap-2">
                    <svg className="w-8 h-8 text-success/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-sf-weak">今日のタスクはありません</p>
                  </div>
                </LightningCardBody>
              ) : (
                <ul className="divide-y divide-sf-border">
                  {urgentTasks.length > 0 && (
                    <li className="px-4 py-1.5 bg-danger/5">
                      <p className="text-2xs font-semibold text-danger uppercase tracking-wide">期限超過・本日期限</p>
                    </li>
                  )}
                  {urgentTasks.map((task) => (
                    <li key={task.id} className="px-4 py-3 hover:bg-sf-bg transition-colors">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTask(task.id, task.status)}
                          className="w-3.5 h-3.5 rounded border-2 border-danger mt-0.5 shrink-0 hover:bg-danger/10 transition-colors focus:outline-none"
                          aria-label="完了にする"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-medium text-sf-text leading-snug">{task.title}</p>
                            <TodayBadge dueDate={task.dueDate} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <TaskPriorityBadge priority={task.priority} />
                            {task.company && (
                              <span className="text-2xs text-sf-weak truncate">{task.company.companyName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {upcomingTasks.length > 0 && (
                    <li className="px-4 py-1.5 bg-sf-bg/60">
                      <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">今後の予定</p>
                    </li>
                  )}
                  {upcomingTasks.map((task) => (
                    <li key={task.id} className="px-4 py-3 hover:bg-sf-bg transition-colors">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTask(task.id, task.status)}
                          className="w-3.5 h-3.5 rounded border-2 border-sf-border mt-0.5 shrink-0 hover:border-primary-400 hover:bg-primary-50 transition-colors focus:outline-none"
                          aria-label="完了にする"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-sf-text leading-snug">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <TaskPriorityBadge priority={task.priority} />
                            {task.dueDate && (
                              <span className="text-2xs text-sf-weak tabular-nums">{formatDate(task.dueDate)}</span>
                            )}
                            {task.company && (
                              <span className="text-2xs text-sf-weak truncate">{task.company.companyName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </LightningCard>

            {/* Company status donut */}
            <LightningCard>
              <LightningCardHeader
                title="顧客企業ステータス"
                action={
                  <Link href="/companies" className="text-xs text-primary-500 hover:underline">
                    企業一覧
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
              <LightningCardBody>
                {companyStatusData.length === 0 ? (
                  <p className="text-sm text-sf-weak text-center py-4">データがありません</p>
                ) : (
                  <DonutChart data={companyStatusData} size={110} centerLabel="社" />
                )}
              </LightningCardBody>
            </LightningCard>

            {/* Stage count chart */}
            <LightningCard>
              <LightningCardHeader
                title="ステージ別件数"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                }
              />
              <LightningCardBody>
                {stageAmountData.every((d) => d.count === 0) ? (
                  <p className="text-sm text-sf-weak text-center py-4">データがありません</p>
                ) : (
                  <HorizontalBarChart
                    data={stageAmountData.map((d) => ({ ...d, value: d.count }))}
                    valueFormatter={(v) => `${v}件`}
                  />
                )}
              </LightningCardBody>
            </LightningCard>
          </div>
        </div>
      </div>
    </div>
  );
}
