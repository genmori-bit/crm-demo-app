"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { HorizontalBarChart, DonutChart } from "@/components/ui/simple-chart";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { DealStageBadge, TaskPriorityBadge } from "@/components/ui/status-badges";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { formatAmount, formatCurrencyShort, formatDate, isOverdue } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  companyCount: number;
  contactCount: number;
  activeDealsCount: number;
  activeDealsAmount: number;
  expectedRevenue: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  staleDealsCount: number;
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

// ─── Design constants ─────────────────────────────────────────────────────────

// 4-color simplified palette (qualification→negotiation=blue, final_review=teal, won=green, lost=red)
const STAGE_COLORS: Record<string, string> = {
  qualification:     "#7996b5",
  needs_analysis:    "#5a8fc4",
  value_proposition: "#3d79b8",
  proposal:          "#0176d3",
  negotiation:       "#6b34b0",
  final_review:      "#0e7490",
  won:               "#2e844a",
  lost:              "#ba0517",
};

const COMPANY_STATUS_COLORS: Record<string, string> = {
  prospect:    "#0176d3",
  active:      "#2e844a",
  negotiating: "#9050e9",
  dormant:     "#a8a29e",
};

const COMPANY_STATUS_LABELS: Record<string, string> = {
  prospect:    "見込み",
  active:      "既存顧客",
  negotiating: "商談中",
  dormant:     "休眠",
};

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "おはようございます";
  if (h < 18) return "こんにちは";
  return "お疲れ様です";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlertChip({
  label,
  count,
  tone,
  href,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "neutral";
  href: string;
}) {
  const styles = {
    danger:  "bg-danger/10 text-danger border-danger/20 hover:bg-danger/15",
    warning: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
    neutral: "bg-sf-bg text-sf-weak border-sf-border hover:bg-sf-surface",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-2xs font-semibold transition-colors",
        styles[tone]
      )}
    >
      {count > 0 && (
        <span className={cn(
          "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
          tone === "danger" ? "bg-danger text-white" :
          tone === "warning" ? "bg-warning text-white" :
          "bg-sf-weak text-white"
        )}>
          {count > 99 ? "99+" : count}
        </span>
      )}
      {label}
    </Link>
  );
}

function ProbabilityDot({ value }: { value: number }) {
  const color =
    value >= 75 ? "bg-success" :
    value >= 50 ? "bg-primary-500" :
    value >= 25 ? "bg-warning" :
    "bg-sf-weak";
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", color)} />;
}

function TodayBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue = isOverdue(dueDate);
  if (overdue) return (
    <span className="text-2xs bg-danger/10 text-danger font-semibold px-1.5 py-0.5 rounded">期限超過</span>
  );
  if (dueDate.slice(0, 10) === todayStr) return (
    <span className="text-2xs bg-warning/15 text-warning font-semibold px-1.5 py-0.5 rounded">今日</span>
  );
  return null;
}

// ─── Today Actions panel ──────────────────────────────────────────────────────

function TodayActionsPanel({
  tasks,
  onToggle,
}: {
  tasks: DashboardData["pendingTasks"];
  onToggle: (id: string, status: string) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const urgentTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return t.dueDate.slice(0, 10) <= todayStr;
  });
  const upcomingTasks = tasks
    .filter((t) => {
      if (!t.dueDate) return true;
      return t.dueDate.slice(0, 10) > todayStr;
    })
    .slice(0, 4);

  if (urgentTasks.length === 0 && upcomingTasks.length === 0) {
    return (
      <LightningCardBody>
        <div className="flex flex-col items-center py-8 gap-2">
          <svg className="w-10 h-10 text-success/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-success">全タスク完了！</p>
          <p className="text-xs text-sf-weak">今日の予定はありません</p>
        </div>
      </LightningCardBody>
    );
  }

  return (
    <ul className="divide-y divide-sf-border">
      {urgentTasks.length > 0 && (
        <li className="px-4 py-1.5 bg-danger/5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
          <p className="text-2xs font-bold text-danger uppercase tracking-wide">
            期限超過・本日期限 {urgentTasks.length}件
          </p>
        </li>
      )}
      {urgentTasks.map((task) => (
        <TaskRow key={task.id} task={task} urgent onToggle={onToggle} />
      ))}
      {upcomingTasks.length > 0 && urgentTasks.length > 0 && (
        <li className="px-4 py-1 bg-sf-bg/60">
          <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">今後の予定</p>
        </li>
      )}
      {upcomingTasks.map((task) => (
        <TaskRow key={task.id} task={task} urgent={false} onToggle={onToggle} />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  urgent,
  onToggle,
}: {
  task: DashboardData["pendingTasks"][number];
  urgent: boolean;
  onToggle: (id: string, status: string) => void;
}) {
  return (
    <li className="px-4 py-2.5 hover:bg-sf-bg transition-colors">
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggle(task.id, task.status)}
          className={cn(
            "w-4 h-4 rounded border-2 mt-0.5 shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
            urgent
              ? "border-danger hover:bg-danger/10"
              : "border-sf-border hover:border-primary-400 hover:bg-primary-50"
          )}
          aria-label={`${task.title}を完了にする`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 flex-wrap">
            <p className="text-xs font-medium text-sf-text leading-snug">{task.title}</p>
            <TodayBadge dueDate={task.dueDate} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <TaskPriorityBadge priority={task.priority} />
            {task.company && (
              <span className="text-2xs text-sf-weak truncate">{task.company.companyName}</span>
            )}
            {task.dueDate && !urgent && (
              <span className="text-2xs text-sf-weak tabular-nums">{formatDate(task.dueDate)}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function HomePageSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 skeleton w-40" />
            <div className="h-3 skeleton w-28" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 skeleton w-20 rounded-sf" />
            <div className="h-7 skeleton w-20 rounded-sf" />
          </div>
        </div>
      </div>
      {/* KPI skeleton */}
      <div className="px-4 pt-4 pb-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-sf-surface border border-sf-border rounded-lg p-4 space-y-3 animate-in">
              <div className="h-3 skeleton w-1/2" />
              <div className="h-7 skeleton w-3/4" />
              <div className="h-3 skeleton w-2/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-sf-surface border border-sf-border rounded-lg p-3 animate-in">
              <div className="h-3 skeleton w-1/3 mb-2" />
              <div className="h-5 skeleton w-1/2" />
            </div>
          ))}
        </div>
      </div>
      {/* Body skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-sf-surface rounded-sf border border-sf-border h-52 animate-in" />
            <div className="bg-sf-surface rounded-sf border border-sf-border h-64 animate-in" />
          </div>
          <div className="space-y-4">
            <div className="bg-sf-surface rounded-sf border border-sf-border h-72 animate-in" />
            <div className="bg-sf-surface rounded-sf border border-sf-border h-44 animate-in" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = useSession();
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

  if (!data) return <HomePageSkeleton />;

  // ── Computed values ─────────────────────────────────────────────────────────
  const greeting = getGreeting();
  const userName = session?.user?.name ?? "ユーザー";
  const dateLabel = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const stageAmountData = (["qualification", "needs_analysis", "value_proposition", "proposal", "negotiation", "final_review"] as const).map((stage) => {
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
      color: COMPANY_STATUS_COLORS[status] ?? "#a8a29e",
    }));

  const hasAlerts = data.overdueTasksCount > 0 || data.staleDealsCount > 0;

  return (
    <div className="flex flex-col">

      {/* ── Compact Hero ────────────────────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Greeting */}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-sf-text leading-snug">
                {greeting}、<span className="text-primary-600">{userName}</span>
              </h1>
              <p className="text-2xs text-sf-weak">{dateLabel}</p>
            </div>

            {/* Alert chips */}
            {hasAlerts && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {data.overdueTasksCount > 0 && (
                  <AlertChip
                    label="期限超過タスク"
                    count={data.overdueTasksCount}
                    tone="danger"
                    href="/tasks?filter=overdue"
                  />
                )}
                {data.staleDealsCount > 0 && (
                  <AlertChip
                    label="活動なし商談"
                    count={data.staleDealsCount}
                    tone="warning"
                    href="/deals?filter=stale"
                  />
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/activities/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0 space-y-2.5">
        {/* Primary 4 KPIs */}
        <MetricGrid cols={4}>
          <MetricCard
            label="進行中商談"
            value={`${data.activeDealsCount}件`}
            subValue={formatCurrencyShort(data.activeDealsAmount)}
            tone="brand"
            emphasis="high"
            href="/deals?view=active"
            aria-label={`進行中商談: ${data.activeDealsCount}件`}
          />
          <MetricCard
            label="受注見込み額"
            value={formatCurrencyShort(data.expectedRevenue)}
            subValue="確度加重合計"
            tone="success"
            emphasis="high"
            href="/deals"
            aria-label={`受注見込み額: ${formatCurrencyShort(data.expectedRevenue)}`}
          />
          <MetricCard
            label="未完了タスク"
            value={`${data.pendingTasksCount}件`}
            subValue={data.overdueTasksCount > 0 ? `期限超過 ${data.overdueTasksCount}件` : "期限切れなし"}
            status={data.overdueTasksCount > 0 ? { label: "要対応", tone: "danger" } : undefined}
            tone={data.overdueTasksCount > 0 ? "danger" : "neutral"}
            emphasis="medium"
            href="/tasks"
            aria-label={`未完了タスク: ${data.pendingTasksCount}件`}
          />
          <MetricCard
            label="今月クローズ予定"
            value={`${data.closingThisMonth.length}件`}
            subValue={formatCurrencyShort(data.closingThisMonth.reduce((s, d) => s + d.amount, 0))}
            tone="warning"
            emphasis="medium"
            href="/deals"
            aria-label={`今月クローズ予定: ${data.closingThisMonth.length}件`}
          />
        </MetricGrid>

        {/* Secondary 2 KPIs — equal-width grid (avoids flex-1 on Link issue) */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="顧客企業数"
            value={`${data.companyCount}社`}
            tone="neutral"
            emphasis="low"
            href="/companies"
            aria-label={`顧客企業数: ${data.companyCount}社`}
          />
          <MetricCard
            label="担当者数"
            value={`${data.contactCount}人`}
            tone="neutral"
            emphasis="low"
            href="/contacts"
            aria-label={`担当者数: ${data.contactCount}人`}
          />
        </div>
      </div>

      {/* ── 2-column main area ───────────────────────────────────────────── */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left 2/3 ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

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
                <p className="text-sm text-sf-weak text-center py-6">進行中の商談がありません</p>
              ) : (
                <HorizontalBarChart data={stageAmountData} />
              )}
            </LightningCardBody>
          </LightningCard>

          {/* Closing this month */}
          <LightningCard>
            <LightningCardHeader
              title="今月クローズ予定"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              action={
                <Link href="/deals" className="text-xs text-primary-500 hover:underline">
                  すべて表示
                </Link>
              }
            />
            {data.closingThisMonth.length === 0 ? (
              <LightningCardBody>
                <p className="text-sm text-sf-weak text-center py-6">今月クローズ予定の商談はありません</p>
              </LightningCardBody>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sf-border bg-sf-bg">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">商談名</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak hidden sm:table-cell">ステージ</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak">金額</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak hidden sm:table-cell">確度</th>
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
                          <td className="px-4 py-2.5 hidden sm:table-cell">
                            <DealStageBadge stage={deal.stage} />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-xs font-bold text-sf-text tabular-nums">{formatAmount(deal.amount)}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right hidden sm:table-cell">
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
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              action={
                <Link href="/activities" className="text-xs text-primary-500 hover:underline">
                  すべて表示
                </Link>
              }
            />
            <ActivityTimeline activities={data.recentActivities.slice(0, 6)} />
          </LightningCard>
        </div>

        {/* ── Right 1/3 ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Today's Actions — prominent */}
          <LightningCard>
            <LightningCardHeader
              title="今日のアクション"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              action={
                <Link href="/tasks" className="text-xs text-primary-500 hover:underline">
                  タスク一覧
                </Link>
              }
            />
            <TodayActionsPanel tasks={data.pendingTasks} onToggle={toggleTask} />
          </LightningCard>

          {/* Company status donut */}
          <LightningCard>
            <LightningCardHeader
              title="顧客企業ステータス"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              action={
                <Link href="/companies" className="text-xs text-primary-500 hover:underline">
                  企業一覧
                </Link>
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
        </div>
      </div>
    </div>
  );
}
