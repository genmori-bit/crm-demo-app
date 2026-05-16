"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Mail, Phone, Building2, TrendingUp, CheckSquare2, Activity,
  Users, CalendarDays, AlertTriangle, Clock, Target,
  PhoneCall, MessageSquare, Video, FileText, BarChart3
} from "lucide-react";
import { cn, formatDate, formatCurrencyShort } from "@/lib/utils";
import { MetricStrip } from "@/components/ui/metric-card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  outcome: string | null;
  activityDate: string;
  durationMinutes: number | null;
  nextAction: string | null;
  nextActionDueDate: string | null;
  company: { id: string; companyName: string } | null;
  deal: { id: string; dealName: string } | null;
  contact: { id: string; fullName: string } | null;
}

interface DealItem {
  id: string;
  dealName: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  lastActivityAt: string | null;
  nextAction: string | null;
  riskLevel: string | null;
  activityCount: number;
  company: { id: string; companyName: string } | null;
}

interface AccountTeamItem {
  role: string;
  isPrimary: boolean;
  company: { id: string; companyName: string; tier: string | null; healthScore: number | null; lifecycleStage: string | null };
}

interface TaskItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  company: { id: string; companyName: string } | null;
  deal: { id: string; dealName: string } | null;
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  department: string | null;
  title: string | null;
  phone: string | null;
  mobilePhone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  manager: { id: string; name: string | null; title: string | null } | null;
  reports: { id: string; name: string | null; title: string | null; department: string | null }[];
  teamMemberships: { team: { id: string; name: string } }[];
  kpis: {
    ownedDealsCount: number;
    openPipelineAmount: number;
    closingThisMonthAmount: number;
    thisMonthActivityCount: number;
    thisMonthMeetingCount: number;
    pendingTaskCount: number;
    overdueTaskCount: number;
    accountTeamCount: number;
    staleDealCount: number;
  };
  recentActivities: ActivityItem[];
  ownedDeals: DealItem[];
  accountTeams: AccountTeamItem[];
  pendingTasks: TaskItem[];
  activityBreakdown: { type: string; _count: { id: number } }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "管理者", cls: "bg-danger/10 text-danger" },
  MANAGER: { label: "マネージャー", cls: "bg-warning/10 text-warning" },
  SALES: { label: "営業", cls: "bg-primary-50 text-primary-600" },
};

const STAGE_CONFIG: Record<string, { label: string; cls: string }> = {
  lead: { label: "リード", cls: "bg-sf-background text-sf-weak" },
  hearing: { label: "ヒアリング", cls: "bg-blue-50 text-blue-700" },
  proposal: { label: "提案", cls: "bg-indigo-50 text-indigo-700" },
  negotiation: { label: "交渉", cls: "bg-orange-50 text-orange-700" },
  commit: { label: "確約", cls: "bg-yellow-50 text-yellow-700" },
  won: { label: "受注", cls: "bg-success/10 text-success" },
  lost: { label: "失注", cls: "bg-danger/10 text-danger" },
};

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  LOW: { label: "低", cls: "text-success" },
  MEDIUM: { label: "中", cls: "text-warning" },
  HIGH: { label: "高", cls: "text-danger" },
  CRITICAL: { label: "緊急", cls: "text-danger font-bold" },
};

const ACTIVITY_TYPE_ICON: Record<string, React.ReactNode> = {
  call: <PhoneCall className="w-3.5 h-3.5" />,
  email: <MessageSquare className="w-3.5 h-3.5" />,
  meeting: <Video className="w-3.5 h-3.5" />,
  demo: <BarChart3 className="w-3.5 h-3.5" />,
  note: <FileText className="w-3.5 h-3.5" />,
  proposal: <FileText className="w-3.5 h-3.5" />,
  follow_up: <Clock className="w-3.5 h-3.5" />,
  negotiation: <Target className="w-3.5 h-3.5" />,
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  call: "電話", email: "メール", meeting: "会議", demo: "デモ",
  note: "メモ", proposal: "提案", follow_up: "フォロー", negotiation: "交渉",
};

const OUTCOME_CONFIG: Record<string, { label: string; cls: string }> = {
  POSITIVE: { label: "ポジティブ", cls: "text-success" },
  NEUTRAL: { label: "通常", cls: "text-sf-weak" },
  NEGATIVE: { label: "ネガティブ", cls: "text-danger" },
  NO_RESPONSE: { label: "応答なし", cls: "text-sf-weak" },
  NEXT_STEP_CREATED: { label: "次Step設定", cls: "text-primary-600" },
  COMPLETED: { label: "完了", cls: "text-success" },
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: "高", cls: "text-danger" },
  medium: { label: "中", cls: "text-warning" },
  low: { label: "低", cls: "text-sf-weak" },
};

function UserAvatar({ name, size = "lg" }: { name: string | null; size?: "sm" | "md" | "lg" }) {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?";
  const sz = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" }[size];
  return (
    <div className={cn("rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0", sz)}>
      {initials}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "概要" },
  { id: "deals", label: "担当商談" },
  { id: "activities", label: "活動" },
  { id: "accounts", label: "担当取引先" },
  { id: "tasks", label: "タスク" },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-sf-weak text-sm">読み込み中...</div>
    );
  }

  if (!user) {
    return <div className="p-12 text-center text-sf-weak">ユーザーが見つかりません</div>;
  }

  const role = ROLE_LABELS[user.role] ?? { label: user.role, cls: "bg-sf-background text-sf-text" };
  const now = new Date();

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-sf-surface rounded-lg border border-sf-border shadow-sm p-5">
        <div className="flex items-start gap-4">
          <UserAvatar name={user.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-sf-text">{user.name ?? "(名前なし)"}</h1>
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", role.cls)}>{role.label}</span>
              {user.status === "ACTIVE" ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <span className="w-2 h-2 rounded-full bg-success inline-block" /> 有効
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-sf-weak">
                  <span className="w-2 h-2 rounded-full bg-sf-weak inline-block" /> {user.status}
                </span>
              )}
            </div>
            <p className="text-sm text-sf-text mt-0.5">
              {user.department} {user.title ? `· ${user.title}` : ""}
            </p>
            {user.manager && (
              <p className="text-xs text-sf-weak mt-1">
                上長:{" "}
                <Link href={`/users/${user.manager.id}`} className="text-primary-600 hover:underline">
                  {user.manager.name}
                </Link>
                {user.manager.title ? ` (${user.manager.title})` : ""}
              </p>
            )}
            {user.teamMemberships.length > 0 && (
              <p className="text-xs text-sf-weak mt-0.5">
                チーム: {user.teamMemberships.map((m) => m.team.name).join(", ")}
              </p>
            )}
          </div>
          {/* Contact info */}
          <div className="text-right text-xs text-sf-weak space-y-1">
            {user.email && (
              <div className="flex items-center justify-end gap-1">
                <Mail className="w-3 h-3" />
                <a href={`mailto:${user.email}`} className="text-primary-600 hover:underline">{user.email}</a>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center justify-end gap-1">
                <Phone className="w-3 h-3" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.lastLoginAt && (
              <p>最終ログイン: {formatDate(user.lastLoginAt)}</p>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="mt-4 pt-4 border-t border-sf-border">
          <MetricStrip
            items={[
              {
                label: "担当商談",
                value: `${user.kpis.ownedDealsCount}件`,
                sub: "進行中",
                emphasis: "high",
              },
              {
                label: "パイプライン",
                value: formatCurrencyShort(user.kpis.openPipelineAmount),
                sub: "進行中合計",
                emphasis: "high",
                tone: "brand",
              },
              {
                label: "今月クローズ予定",
                value: formatCurrencyShort(user.kpis.closingThisMonthAmount),
                emphasis: "medium",
                tone: user.kpis.closingThisMonthAmount > 0 ? "success" : "neutral",
              },
              {
                label: "今月活動数",
                value: `${user.kpis.thisMonthActivityCount}件`,
                sub: `会議 ${user.kpis.thisMonthMeetingCount}件`,
                emphasis: "medium",
              },
              {
                label: "未完タスク",
                value: `${user.kpis.pendingTaskCount}件`,
                sub: user.kpis.overdueTaskCount > 0 ? `期限超過 ${user.kpis.overdueTaskCount}件` : undefined,
                tone: user.kpis.overdueTaskCount > 0 ? "danger" : "neutral",
                emphasis: "medium",
              },
              {
                label: "活動なし商談",
                value: `${user.kpis.staleDealCount}件`,
                sub: "30日超過",
                tone: user.kpis.staleDealCount > 0 ? "warning" : "neutral",
                emphasis: "low",
              },
            ]}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-sf-border">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === t.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === "overview" && <OverviewTab user={user} now={now} />}
      {tab === "deals" && <DealsTab deals={user.ownedDeals} />}
      {tab === "activities" && <ActivitiesTab activities={user.recentActivities} />}
      {tab === "accounts" && <AccountsTab accounts={user.accountTeams} />}
      {tab === "tasks" && <TasksTab tasks={user.pendingTasks} now={now} />}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ user, now }: { user: UserDetail; now: Date }) {
  const typeLabels = user.activityBreakdown
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 6);

  const topDeals = user.ownedDeals
    .filter((d) => !["won", "lost"].includes(d.stage))
    .slice(0, 5);

  const overdueTasks = user.pendingTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done"
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Activity + Deals */}
      <div className="lg:col-span-2 space-y-5">
        {/* Activity breakdown */}
        <div className="bg-sf-surface rounded-lg border border-sf-border p-4">
          <h2 className="text-sm font-semibold text-sf-text mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sf-weak" />
            今月の活動内訳
          </h2>
          {typeLabels.length === 0 ? (
            <p className="text-xs text-sf-weak">今月の活動はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {typeLabels.map((item) => (
                <div key={item.type} className="flex items-center gap-1.5 bg-sf-background px-3 py-1.5 rounded-full text-xs">
                  <span className="text-sf-weak">{ACTIVITY_TYPE_ICON[item.type] ?? <Activity className="w-3.5 h-3.5" />}</span>
                  <span className="text-sf-text font-medium">{ACTIVITY_TYPE_LABEL[item.type] ?? item.type}</span>
                  <span className="font-bold text-primary-600">{item._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top deals */}
        <div className="bg-sf-surface rounded-lg border border-sf-border overflow-hidden">
          <div className="px-4 py-3 border-b border-sf-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sf-weak" />
            <h2 className="text-sm font-semibold text-sf-text">進行中の商談</h2>
          </div>
          {topDeals.length === 0 ? (
            <p className="p-4 text-xs text-sf-weak">担当商談はありません</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sf-border bg-sf-background">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">商談</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">ステージ</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-sf-weak">金額</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-sf-weak">クローズ予定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {topDeals.map((deal) => {
                  const stage = STAGE_CONFIG[deal.stage] ?? { label: deal.stage, cls: "text-sf-weak" };
                  const risk = deal.riskLevel ? RISK_CONFIG[deal.riskLevel] : null;
                  return (
                    <tr key={deal.id} className="hover:bg-sf-background/50">
                      <td className="px-4 py-2.5">
                        <Link href={`/deals/${deal.id}`} className="text-primary-600 hover:underline font-medium">
                          {deal.dealName}
                        </Link>
                        <p className="text-xs text-sf-weak">{deal.company?.companyName}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-xs px-2 py-0.5 rounded font-medium", stage.cls)}>
                          {stage.label}
                        </span>
                        {risk && (
                          <span className={cn("ml-1 text-xs", risk.cls)}>▲ {risk.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {formatCurrencyShort(deal.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-sf-weak">
                        {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent activities */}
        <div className="bg-sf-surface rounded-lg border border-sf-border overflow-hidden">
          <div className="px-4 py-3 border-b border-sf-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-sf-weak" />
            <h2 className="text-sm font-semibold text-sf-text">最近の活動</h2>
          </div>
          <div className="divide-y divide-sf-border max-h-80 overflow-y-auto">
            {user.recentActivities.slice(0, 10).map((act) => {
              const outcome = act.outcome ? OUTCOME_CONFIG[act.outcome] : null;
              return (
                <div key={act.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="mt-0.5 text-sf-weak shrink-0">
                    {ACTIVITY_TYPE_ICON[act.type] ?? <Activity className="w-3.5 h-3.5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sf-text font-medium truncate">{act.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-sf-weak mt-0.5 flex-wrap">
                      <span>{formatDate(act.activityDate)}</span>
                      {act.company && (
                        <Link href={`/companies/${act.company.id}`} className="text-primary-600 hover:underline">
                          {act.company.companyName}
                        </Link>
                      )}
                      {act.deal && (
                        <Link href={`/deals/${act.deal.id}`} className="text-primary-600 hover:underline">
                          {act.deal.dealName}
                        </Link>
                      )}
                      {outcome && (
                        <span className={outcome.cls}>{outcome.label}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-5">
        {/* Overdue tasks */}
        {overdueTasks.length > 0 && (
          <div className="bg-danger/5 rounded-lg border border-danger/20 p-4">
            <h2 className="text-sm font-semibold text-danger mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              期限超過タスク ({overdueTasks.length}件)
            </h2>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="text-xs">
                  <p className="text-sf-text font-medium">{task.title}</p>
                  <p className="text-danger">{task.dueDate ? formatDate(task.dueDate) : "—"} 期限</p>
                  {task.company && (
                    <Link href={`/companies/${task.company.id}`} className="text-primary-600 hover:underline">
                      {task.company.companyName}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct reports */}
        {user.reports.length > 0 && (
          <div className="bg-sf-surface rounded-lg border border-sf-border p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-sf-weak" />
              部下 ({user.reports.length}名)
            </h2>
            <div className="space-y-2">
              {user.reports.map((rep) => (
                <div key={rep.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {rep.name ? rep.name[0] : "?"}
                  </div>
                  <div>
                    <Link href={`/users/${rep.id}`} className="text-xs font-medium text-primary-600 hover:underline">
                      {rep.name}
                    </Link>
                    <p className="text-xs text-sf-weak">{rep.title ?? rep.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="bg-sf-surface rounded-lg border border-sf-border p-4">
          <h2 className="text-sm font-semibold text-sf-text mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sf-weak" />
            アカウント情報
          </h2>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-sf-weak">担当取引先</dt>
              <dd className="font-medium text-sf-text">{user.kpis.accountTeamCount}社</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sf-weak">登録日</dt>
              <dd className="text-sf-text">{formatDate(user.createdAt)}</dd>
            </div>
            {user.lastLoginAt && (
              <div className="flex justify-between">
                <dt className="text-sf-weak">最終ログイン</dt>
                <dd className="text-sf-text">{formatDate(user.lastLoginAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

// ─── Deals Tab ────────────────────────────────────────────────────────────────

function DealsTab({ deals }: { deals: DealItem[] }) {
  const now = new Date();
  return (
    <div className="bg-sf-surface rounded-lg border border-sf-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sf-border bg-sf-background">
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">商談名</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ステージ</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">金額</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">確度</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">クローズ予定</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">最終活動</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">次回アクション</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sf-border">
          {deals.map((deal) => {
            const stage = STAGE_CONFIG[deal.stage] ?? { label: deal.stage, cls: "text-sf-weak" };
            const risk = deal.riskLevel ? RISK_CONFIG[deal.riskLevel] : null;
            const lastAct = deal.lastActivityAt ? new Date(deal.lastActivityAt) : null;
            const daysSince = lastAct ? Math.floor((now.getTime() - lastAct.getTime()) / 86400000) : null;
            const stale = daysSince == null || daysSince > 30;
            return (
              <tr key={deal.id} className="hover:bg-sf-background/50">
                <td className="px-4 py-3">
                  <Link href={`/deals/${deal.id}`} className="text-primary-600 hover:underline font-medium">
                    {deal.dealName}
                  </Link>
                  <p className="text-xs text-sf-weak">{deal.company?.companyName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded font-medium", stage.cls)}>
                    {stage.label}
                  </span>
                  {risk && <span className={cn("ml-1 text-xs", risk.cls)}>▲</span>}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatCurrencyShort(deal.amount)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-sf-weak">{deal.probability}%</td>
                <td className="px-4 py-3 text-xs text-sf-weak">
                  {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {stale ? (
                    <span className="text-danger flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {daysSince != null ? `${daysSince}日前` : "なし"}
                    </span>
                  ) : (
                    <span className="text-sf-weak">{daysSince != null ? `${daysSince}日前` : "—"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-sf-weak max-w-[160px] truncate">
                  {deal.nextAction ?? <span className="text-warning">未設定</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {deals.length === 0 && (
        <p className="p-6 text-center text-sm text-sf-weak">担当商談はありません</p>
      )}
    </div>
  );
}

// ─── Activities Tab ───────────────────────────────────────────────────────────

function ActivitiesTab({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-sf-surface rounded-lg border border-sf-border divide-y divide-sf-border">
      {activities.length === 0 ? (
        <p className="p-6 text-center text-sm text-sf-weak">活動履歴はありません</p>
      ) : (
        activities.map((act) => {
          const outcome = act.outcome ? OUTCOME_CONFIG[act.outcome] : null;
          return (
            <div key={act.id} className="px-4 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sf-background border border-sf-border flex items-center justify-center shrink-0 text-sf-weak">
                {ACTIVITY_TYPE_ICON[act.type] ?? <Activity className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-sf-text font-medium">{act.subject}</p>
                  <span className="text-xs text-sf-weak shrink-0">{formatDate(act.activityDate)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-sf-weak">
                  <span className="bg-sf-background px-1.5 py-0.5 rounded">
                    {ACTIVITY_TYPE_LABEL[act.type] ?? act.type}
                  </span>
                  {act.durationMinutes && <span>{act.durationMinutes}分</span>}
                  {act.company && (
                    <Link href={`/companies/${act.company.id}`} className="text-primary-600 hover:underline">
                      {act.company.companyName}
                    </Link>
                  )}
                  {act.deal && (
                    <Link href={`/deals/${act.deal.id}`} className="text-primary-600 hover:underline">
                      {act.deal.dealName}
                    </Link>
                  )}
                  {outcome && <span className={outcome.cls}>{outcome.label}</span>}
                </div>
                {act.nextAction && (
                  <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    次回: {act.nextAction}
                    {act.nextActionDueDate ? ` (${formatDate(act.nextActionDueDate)})` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Accounts Tab ─────────────────────────────────────────────────────────────

const TEAM_ROLE_LABELS: Record<string, string> = {
  OWNER: "オーナー", ACCOUNT_MANAGER: "AM", SALES_REP: "営業", CSM: "CSM",
  SALES_ENGINEER: "SE", MARKETER: "マーケ", SUPPORT: "サポート",
  EXECUTIVE_SPONSOR: "役員スポンサー", PARTNER_MANAGER: "PRM", OTHER: "その他",
};

const LIFECYCLE_LABELS: Record<string, { label: string; cls: string }> = {
  TARGET: { label: "ターゲット", cls: "text-sf-weak" },
  LEAD: { label: "リード", cls: "text-primary-600" },
  OPPORTUNITY: { label: "商談中", cls: "text-warning" },
  CUSTOMER: { label: "顧客", cls: "text-success" },
  EXPANSION: { label: "拡張", cls: "text-success font-semibold" },
};

function AccountsTab({ accounts }: { accounts: AccountTeamItem[] }) {
  return (
    <div className="bg-sf-surface rounded-lg border border-sf-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sf-border bg-sf-background">
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">取引先</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">役割</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ステージ</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">Tier</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">ヘルス</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sf-border">
          {accounts.map((atm) => {
            const lifecycle = atm.company.lifecycleStage
              ? LIFECYCLE_LABELS[atm.company.lifecycleStage] ?? { label: atm.company.lifecycleStage, cls: "" }
              : null;
            const hs = atm.company.healthScore;
            return (
              <tr key={atm.company.id} className="hover:bg-sf-background/50">
                <td className="px-4 py-3">
                  <Link href={`/companies/${atm.company.id}`} className="text-primary-600 hover:underline font-medium">
                    {atm.company.companyName}
                  </Link>
                  {atm.isPrimary && (
                    <span className="ml-2 text-xs text-success font-medium">主担当</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-sf-background px-2 py-0.5 rounded">
                    {TEAM_ROLE_LABELS[atm.role] ?? atm.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lifecycle ? (
                    <span className={cn("text-xs", lifecycle.cls)}>{lifecycle.label}</span>
                  ) : (
                    <span className="text-xs text-sf-weak">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-sf-weak">{atm.company.tier ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {hs != null ? (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        hs >= 80 ? "text-success" : hs >= 60 ? "text-warning" : "text-danger"
                      )}
                    >
                      {hs}
                    </span>
                  ) : (
                    <span className="text-xs text-sf-weak">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {accounts.length === 0 && (
        <p className="p-6 text-center text-sm text-sf-weak">担当取引先はありません</p>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ tasks, now }: { tasks: TaskItem[]; now: Date }) {
  return (
    <div className="bg-sf-surface rounded-lg border border-sf-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sf-border bg-sf-background">
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">タスク</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">関連先</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">優先度</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ステータス</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">期限</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sf-border">
          {tasks.map((task) => {
            const pri = PRIORITY_CONFIG[task.priority] ?? { label: task.priority, cls: "text-sf-weak" };
            const due = task.dueDate ? new Date(task.dueDate) : null;
            const overdue = due && due < now && task.status !== "done";
            return (
              <tr key={task.id} className="hover:bg-sf-background/50">
                <td className="px-4 py-3 font-medium text-sf-text">{task.title}</td>
                <td className="px-4 py-3 text-xs">
                  {task.company && (
                    <Link href={`/companies/${task.company.id}`} className="text-primary-600 hover:underline block">
                      {task.company.companyName}
                    </Link>
                  )}
                  {task.deal && (
                    <Link href={`/deals/${task.deal.id}`} className="text-primary-600 hover:underline block">
                      {task.deal.dealName}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium", pri.cls)}>{pri.label}</span>
                </td>
                <td className="px-4 py-3 text-xs text-sf-weak">{task.status}</td>
                <td className="px-4 py-3 text-xs">
                  {due ? (
                    <span className={overdue ? "text-danger font-medium flex items-center gap-1" : "text-sf-weak"}>
                      {overdue && <AlertTriangle className="w-3 h-3" />}
                      {formatDate(task.dueDate!)}
                    </span>
                  ) : (
                    <span className="text-sf-weak">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <p className="p-6 text-center text-sm text-sf-weak">未完了タスクはありません</p>
      )}
    </div>
  );
}
