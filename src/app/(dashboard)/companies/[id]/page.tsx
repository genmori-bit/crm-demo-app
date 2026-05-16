"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileAttachmentsCard } from "@/components/ui/file-attachments-card";
import { MetricCard, MetricStrip } from "@/components/ui/metric-card";
import { ObjectIcon } from "@/components/ui/object-icon";
import { RecordLink, UserLink } from "@/components/ui/record-link";
import { ActivityTimeline } from "@/components/ui/activity-timeline";

// ── Types ──────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  companyName: string;
  legalName?: string;
  displayName?: string;
  domain?: string;
  website?: string;
  phone?: string;
  mainEmail?: string;
  industry?: string;
  subIndustry?: string;
  employeeSize?: string;
  annualRevenue?: number;
  capital?: number;
  foundedYear?: number;
  stockMarket?: string;
  stockSymbol?: string;
  corporateNumber?: string;
  tier?: string;
  status?: string;
  type?: string;
  lifecycleStage?: string;
  source?: string;
  billingCountry?: string;
  billingPrefecture?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingAddress?: string;
  description?: string;
  businessSummary?: string;
  painPoints?: string[];
  objectives?: string[];
  competitors?: string[];
  technologies?: string[];
  healthScore?: number;
  fitScore?: number;
  engagementScore?: number;
  arr?: number;
  mrr?: number;
  renewalDate?: string;
  openPipelineAmount: number;
  wonAmount: number;
  activeContractValue: number;
  lastActivityAt?: string;
  lastEngagementAt?: string;
  nextTaskDueAt?: string;
  parentCompany?: { id: string; companyName: string };
  childCompanies?: { id: string; companyName: string; tier?: string; status?: string }[];
  contacts: {
    id: string; fullName: string; email?: string; role?: string; isPrimary?: boolean;
    title?: string; phone?: string;
  }[];
  deals: {
    id: string; dealName: string; stage: string; amount?: number;
    expectedCloseDate?: string; probability?: number;
    lastActivityAt?: string; nextAction?: string; riskLevel?: string;
    activityCount?: number;
    owner?: { id: string; name: string | null; department?: string | null } | null;
    salesRep?: { id: string; name: string | null } | null;
  }[];
  tasks: {
    id: string; title: string; status: string; dueDate?: string; priority?: string;
    assignee?: { id: string; name: string | null } | null;
  }[];
  cases: {
    id: string; caseNumber: string; subject: string; status: string;
    priority: string; createdAt: string;
  }[];
  campaigns: { id: string; name: string; status: string; type?: string }[];
  contracts: {
    id: string; contractNumber?: string; status: string;
    startDate?: string; endDate?: string; value?: number;
  }[];
  orders: { id: string; orderNumber?: string; status: string; totalAmount?: number }[];
  activities: {
    id: string; type: string; subject?: string; body?: string;
    activityDate?: string; createdAt: string;
    outcome?: string | null; durationMinutes?: number | null;
    nextAction?: string | null; nextActionDueDate?: string | null;
    owner?: { id: string; name: string | null } | null;
    contact?: { id: string; fullName: string } | null;
    deal?: { id: string; dealName: string } | null;
  }[];
  accountTeamMembers: {
    id: string; role: string; isPrimary: boolean;
    user: {
      id: string; name: string | null; email: string;
      department?: string | null; title?: string | null; phone?: string | null;
    };
  }[];
  accountInsights: {
    id: string; type: string; title: string; body: string; severity: string;
    source: string; actionLabel?: string; actionUrl?: string;
    isDismissed: boolean; createdAt: string;
  }[];
  accountPlans: { id: string; name: string; fiscalYear: string; status: string; summary?: string }[];
  accountStakeholders: {
    id: string; influenceLevel: string; attitude: string; decisionRole: string; notes?: string;
    contact: { id: string; fullName: string; email?: string; title?: string };
  }[];
  accountHealthSnapshots: { id: string; healthScore: number; riskLevel: string; measuredAt: string }[];
  sourceRelationships: {
    id: string; relationshipType: string;
    targetCompany: { id: string; companyName: string };
  }[];
  targetRelationships: {
    id: string; relationshipType: string;
    sourceCompany: { id: string; companyName: string };
  }[];
  _rollup: {
    contactsCount: number;
    openDealsCount: number;
    openPipelineAmount: number;
    wonAmount: number;
    activeCasesCount: number;
    activeContractsCount: number;
    highScoreLeadsCount: number;
  };
}

// ── Lifecycle helpers ─────────────────────────────────────────────────────

const CUSTOMER_STAGES = new Set(["CUSTOMER", "EXPANSION", "RENEWAL", "CUSTOMER_ONBOARDING", "ACTIVE_CUSTOMER"]);

/** 顧客企業かどうか (typeまたはlifecycleStageで判定) */
function isCustomerCompany(company: { type?: string; lifecycleStage?: string | null }): boolean {
  return company.type === "CUSTOMER" || CUSTOMER_STAGES.has(company.lifecycleStage ?? "");
}

const TYPE_LABEL: Record<string, string> = {
  PROSPECT: "見込み企業",
  CUSTOMER: "顧客企業",
  PARTNER:  "パートナー",
  VENDOR:   "仕入先",
};

const LIFECYCLE_LABEL: Record<string, string> = {
  TARGET:             "ターゲット",
  LEAD:               "見込み",
  OPPORTUNITY:        "商談中",
  CUSTOMER:           "顧客",
  CUSTOMER_ONBOARDING:"オンボーディング中",
  ACTIVE_CUSTOMER:    "アクティブ顧客",
  EXPANSION:          "拡大中",
  RENEWAL:            "更新対象",
  DORMANT:            "休眠",
  CHURNED:            "解約済み",
};

// ── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "概要" },
  { id: "details",       label: "詳細" },
  { id: "stakeholders",  label: "関係者" },
  { id: "sales",         label: "営業" },
  { id: "marketing",     label: "マーケティング" },
  { id: "contracts",     label: "契約・利用" },
  { id: "support",       label: "サポート" },
  { id: "activity",      label: "活動" },
  { id: "insights",      label: "インサイト" },
];

const TIER_MAP: Record<string, { label: string; variant: "danger" | "warning" | "info" | "muted" }> = {
  STRATEGIC: { label: "戦略", variant: "danger" },
  ENTERPRISE: { label: "大手", variant: "warning" },
  MID_MARKET: { label: "中堅", variant: "info" },
  SMB:        { label: "中小", variant: "muted" },
};

const STATUS_MAP: Record<string, { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }> = {
  TARGET:      { label: "ターゲット",   variant: "muted" },
  APPROACHING: { label: "アプローチ中", variant: "info" },
  ACTIVE_DEAL: { label: "商談中",       variant: "warning" },
  CUSTOMER:    { label: "顧客",         variant: "success" },
  DORMANT:     { label: "休眠",         variant: "muted" },
  CHURNED:     { label: "解約",         variant: "danger" },
};

const DEAL_STAGE_MAP: Record<string, { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }> = {
  qualification:     { label: "初期確認",   variant: "muted" },
  needs_analysis:    { label: "課題確認",   variant: "info" },
  value_proposition: { label: "価値提案",   variant: "info" },
  proposal:          { label: "提案",       variant: "info" },
  negotiation:       { label: "交渉",       variant: "warning" },
  final_review:      { label: "最終確認",   variant: "warning" },
  won:               { label: "受注",       variant: "success" },
  lost:              { label: "失注",       variant: "danger" },
};

const TEAM_ROLE_MAP: Record<string, string> = {
  OWNER:           "オーナー",
  ACCOUNT_MANAGER: "担当営業",
  CSM:             "CS担当",
  SE:              "SE",
  PARTNER:         "パートナー",
  EXECUTIVE:       "エグゼクティブ",
};

const TIER_AVATAR_COLOR: Record<string, string> = {
  STRATEGIC: "bg-red-500",
  ENTERPRISE: "bg-orange-500",
  MID_MARKET: "bg-blue-500",
  SMB: "bg-gray-400",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ja-JP");
}

function fmtCurrency(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", minimumFractionDigits: 0 }).format(n);
}

function fmtCompact(n?: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "¥0";
  const abs = Math.abs(n);
  if (abs >= 1_0000_0000) return `¥${(n / 1_0000_0000).toFixed(abs % 1_0000_0000 === 0 ? 0 : 1)}億`;
  if (abs >= 1_0000)      return `¥${(n / 1_0000).toFixed(abs % 1_0000 === 0 ? 0 : 1)}万`;
  return fmtCurrency(n);
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-sf-border/60 last:border-0">
      <dt className="text-xs text-sf-weak w-36 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text flex-1 break-words">{children || "—"}</dd>
    </div>
  );
}

function AddButton({ href, label = "追加" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs text-primary-500 hover:underline">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </Link>
  );
}

function ViewAllLink({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-primary-500 hover:underline focus:outline-none"
    >
      すべて表示 ({count}件)
    </button>
  );
}

// ── Tab: 概要 ──────────────────────────────────────────────────────────────

function OverviewTab({
  company,
  onDismissInsight,
  onTabChange,
}: {
  company: Company;
  onDismissInsight: (id: string) => void;
  onTabChange: (tab: string) => void;
}) {
  const activeInsights = (company.accountInsights ?? []).filter((i) => !i.isDismissed).slice(0, 3);
  const openDeals     = (company.deals ?? []).filter((d) => !["won","lost"].includes(d.stage)).slice(0, 5);
  const openCases     = (company.cases ?? []).filter((c) => c.status !== "Closed").slice(0, 3);
  const topContacts   = (company.contacts ?? []).slice(0, 4);
  const topTasks      = (company.tasks ?? []).filter((t) => t.status !== "done").slice(0, 3);
  const recentActs    = (company.activities ?? []).slice(0, 5);

  const score = company.healthScore ?? 0;
  const healthColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger";

  const insightBg: Record<string, string> = {
    HIGH:   "bg-danger-light border-danger-border text-danger",
    MEDIUM: "bg-warning-light border-warning-border text-warning",
    LOW:    "bg-info-light border-info-border text-info",
    INFO:   "bg-sf-bg border-sf-border text-sf-weak",
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Left (2/3) ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Insight banners */}
        {activeInsights.length > 0 && (
          <div className="space-y-2">
            {activeInsights.map((ins) => (
              <div
                key={ins.id}
                className={`flex items-start gap-3 p-3 rounded-sf border ${insightBg[ins.severity] ?? insightBg.INFO}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{ins.body}</p>
                  {ins.actionLabel && ins.actionUrl && (
                    <a href={ins.actionUrl} className="text-xs underline mt-1 inline-block">
                      {ins.actionLabel}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => onDismissInsight(ins.id)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="非表示"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Business summary */}
        {(company.businessSummary || (company.technologies ?? []).length > 0) && (
          <LightningCard>
            <LightningCardHeader title="企業概要" />
            <LightningCardBody>
              {company.businessSummary && (
                <p className="text-sm text-sf-text whitespace-pre-wrap">{company.businessSummary}</p>
              )}
              {[...(company.technologies ?? []), ...(company.painPoints ?? []), ...(company.objectives ?? [])].length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(company.technologies ?? []).map((t) => <Badge key={t} variant="info">{t}</Badge>)}
                  {(company.painPoints ?? []).map((t) => <Badge key={t} variant="warning">{t}</Badge>)}
                  {(company.objectives ?? []).map((t) => <Badge key={t} variant="success">{t}</Badge>)}
                </div>
              )}
            </LightningCardBody>
          </LightningCard>
        )}

        {/* Open deals summary */}
        <LightningCard>
          <LightningCardHeader
            title="進行中商談"
            count={openDeals.length}
            action={
              <div className="flex items-center gap-3">
                {company.deals.length > 5 && (
                  <ViewAllLink onClick={() => onTabChange("sales")} count={company.deals.filter(d => !["won","lost"].includes(d.stage)).length} />
                )}
                <AddButton href={`/deals/new?companyId=${company.id}`} label="新規商談" />
              </div>
            }
          />
          {openDeals.length === 0 ? (
            <LightningCardBody><EmptyState title="進行中の商談はありません" compact /></LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {openDeals.map((deal) => {
                const stageInfo = DEAL_STAGE_MAP[deal.stage] ?? { label: deal.stage, variant: "muted" as const };
                return (
                  <li key={deal.id}>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-sf-bg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sf-text truncate">{deal.dealName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={stageInfo.variant}>{stageInfo.label}</Badge>
                          {deal.expectedCloseDate && (
                            <span className="text-xs text-sf-weak">{fmtDate(deal.expectedCloseDate)}</span>
                          )}
                          {deal.owner?.name && (
                            <span className="text-xs text-sf-weak">{deal.owner.name}</span>
                          )}
                        </div>
                      </div>
                      {deal.amount != null && (
                        <span className="text-sm font-bold text-sf-text tabular-nums shrink-0">
                          {fmtCurrency(deal.amount)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </LightningCard>

        {/* Open cases summary */}
        {openCases.length > 0 && (
          <LightningCard>
            <LightningCardHeader
              title="未解決ケース"
              count={openCases.length}
              action={<ViewAllLink onClick={() => onTabChange("support")} count={company.cases.length} />}
            />
            <ul className="divide-y divide-sf-border">
              {openCases.map((c) => (
                <li key={c.id} className="px-4 py-2.5 flex items-center gap-3">
                  <Badge variant={c.priority === "HIGH" || c.priority === "CRITICAL" ? "danger" : "muted"}>
                    {c.priority}
                  </Badge>
                  <Link href={`/cases/${c.id}`} className="text-sm text-primary-600 hover:underline truncate flex-1">
                    {c.subject}
                  </Link>
                  <Badge variant="info">{c.status}</Badge>
                </li>
              ))}
            </ul>
          </LightningCard>
        )}
      </div>

      {/* ── Right sidebar (1/3) ── */}
      <div className="space-y-4">
        {/* Health — 顧客企業のみ表示 */}
        {isCustomerCompany(company) ? (
          <LightningCard>
            <LightningCardHeader title="取引先ヘルス" />
            <LightningCardBody>
              <div className="text-center mb-4">
                <p className={`text-5xl font-bold tabular-nums ${healthColor}`}>
                  {company.healthScore ?? "—"}
                </p>
                <p className="text-xs text-sf-weak mt-1">ヘルススコア</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-sf-weak">フィットスコア</span>
                  <span className="font-semibold text-sf-text">{company.fitScore ?? "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sf-weak">エンゲージメント</span>
                  <span className="font-semibold text-sf-text">{company.engagementScore ?? "—"}</span>
                </div>
              </div>
            </LightningCardBody>
          </LightningCard>
        ) : (
          <LightningCard>
            <LightningCardHeader title="営業進捗" />
            <LightningCardBody>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-sf-weak">ステージ</span>
                  <span className="font-semibold text-sf-text">{LIFECYCLE_LABEL[company.lifecycleStage ?? ""] ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sf-weak">進行中商談</span>
                  <span className="font-semibold text-sf-text">{openDeals.length}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sf-weak">パイプライン</span>
                  <span className="font-semibold text-sf-text">
                    {openDeals.reduce((s, d) => s + (d.amount ?? 0), 0).toLocaleString("ja-JP")}円
                  </span>
                </div>
                <p className="text-sf-weak pt-1">ヘルススコアは顧客化後に表示されます</p>
              </div>
            </LightningCardBody>
          </LightningCard>
        )}

        {/* Key contacts */}
        <LightningCard>
          <LightningCardHeader
            title="主要担当者"
            count={topContacts.length}
            action={
              <div className="flex items-center gap-3">
                {company.contacts.length > 4 && (
                  <ViewAllLink onClick={() => onTabChange("stakeholders")} count={company.contacts.length} />
                )}
                <AddButton href={`/contacts/new?companyId=${company.id}`} />
              </div>
            }
          />
          {topContacts.length === 0 ? (
            <LightningCardBody><EmptyState title="担当者未登録" compact /></LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {topContacts.map((c) => (
                <li key={c.id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary-600">{c.fullName[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <RecordLink
                      objectApiName="Contact"
                      recordId={c.id}
                      label={c.fullName}
                      className="text-sm font-medium"
                    />
                    {c.role && <p className="text-xs text-sf-weak truncate">{c.role}</p>}
                  </div>
                  {c.isPrimary && <Badge variant="brand">主</Badge>}
                </li>
              ))}
            </ul>
          )}
        </LightningCard>

        {/* Account team */}
        {(company.accountTeamMembers ?? []).length > 0 && (
          <LightningCard>
            <LightningCardHeader
              title="取引先チーム"
              count={company.accountTeamMembers.length}
              action={<ViewAllLink onClick={() => onTabChange("stakeholders")} count={company.accountTeamMembers.length} />}
            />
            <ul className="divide-y divide-sf-border">
              {company.accountTeamMembers.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-2xs font-bold text-primary-700">{(m.user.name ?? "?")[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <UserLink userId={m.user.id} name={m.user.name} className="text-sm font-medium" />
                    <p className="text-xs text-sf-weak">{TEAM_ROLE_MAP[m.role] ?? m.role}</p>
                  </div>
                  {m.isPrimary && <Badge variant="brand">主</Badge>}
                </li>
              ))}
            </ul>
          </LightningCard>
        )}

        {/* Next tasks */}
        <LightningCard>
          <LightningCardHeader
            title="次のタスク"
            count={topTasks.length}
            action={
              <div className="flex items-center gap-3">
                {company.tasks.length > 3 && (
                  <ViewAllLink onClick={() => onTabChange("activity")} count={company.tasks.length} />
                )}
                <AddButton href={`/tasks/new?companyId=${company.id}`} />
              </div>
            }
          />
          {topTasks.length === 0 ? (
            <LightningCardBody><p className="text-xs text-sf-weak text-center py-3">タスクなし</p></LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {topTasks.map((t) => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date();
                return (
                  <li key={t.id} className="px-4 py-2.5">
                    <p className="text-sm text-sf-text truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.dueDate && (
                        <span className={`text-xs ${overdue ? "text-danger font-semibold" : "text-sf-weak"}`}>
                          {fmtDate(t.dueDate)}{overdue && " ⚠"}
                        </span>
                      )}
                      {t.assignee?.name && (
                        <UserLink userId={t.assignee.id!} name={t.assignee.name} className="text-xs" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </LightningCard>

        {/* Recent activities */}
        <LightningCard>
          <LightningCardHeader
            title="最近の活動"
            count={recentActs.length}
            action={<ViewAllLink onClick={() => onTabChange("activity")} count={company.activities.length} />}
          />
          {recentActs.length === 0 ? (
            <LightningCardBody><p className="text-xs text-sf-weak text-center py-3">活動記録なし</p></LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {recentActs.map((a) => (
                <li key={a.id} className="flex items-start gap-2 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    {a.subject && <p className="text-xs font-medium text-sf-text truncate">{a.subject}</p>}
                    <div className="flex items-center gap-2 text-xs text-sf-weak flex-wrap">
                      <span>{fmtDate(a.activityDate ?? a.createdAt)}</span>
                      {a.owner && (
                        <UserLink userId={a.owner.id} name={a.owner.name} className="text-xs text-primary-600" />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </LightningCard>
      </div>
    </div>
  );
}

// ── Tab: 詳細 ──────────────────────────────────────────────────────────────

function DetailsTab({ company }: { company: Company }) {
  const billingAddr = [
    company.billingPostalCode && `〒${company.billingPostalCode}`,
    company.billingPrefecture,
    company.billingCity,
    company.billingAddress,
    company.billingCountry,
  ].filter(Boolean).join(" ");

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <LightningCard>
        <LightningCardHeader title="基本情報" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="企業名">{company.companyName}</FieldRow>
            <FieldRow label="正式名称">{company.legalName}</FieldRow>
            <FieldRow label="表示名">{company.displayName}</FieldRow>
            <FieldRow label="ウェブサイト">
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                   className="text-primary-500 hover:underline break-all">
                  {company.website}
                </a>
              ) : null}
            </FieldRow>
            <FieldRow label="ドメイン">{company.domain}</FieldRow>
            <FieldRow label="電話">{company.phone}</FieldRow>
            <FieldRow label="メール">{company.mainEmail}</FieldRow>
            <FieldRow label="種別">{company.type}</FieldRow>
            <FieldRow label="ステータス">
              {company.status && STATUS_MAP[company.status] ? (
                <Badge variant={STATUS_MAP[company.status].variant}>{STATUS_MAP[company.status].label}</Badge>
              ) : company.status}
            </FieldRow>
            <FieldRow label="Tier">
              {company.tier && TIER_MAP[company.tier] ? (
                <Badge variant={TIER_MAP[company.tier].variant}>{TIER_MAP[company.tier].label}</Badge>
              ) : company.tier}
            </FieldRow>
            <FieldRow label="ライフサイクル">{company.lifecycleStage}</FieldRow>
            <FieldRow label="ソース">{company.source}</FieldRow>
            <FieldRow label="親会社">
              {company.parentCompany ? (
                <RecordLink objectApiName="Company" recordId={company.parentCompany.id}
                            label={company.parentCompany.companyName} />
              ) : null}
            </FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      <LightningCard>
        <LightningCardHeader title="企業属性" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="業界">{company.industry}</FieldRow>
            <FieldRow label="サブ業界">{company.subIndustry}</FieldRow>
            <FieldRow label="従業員規模">{company.employeeSize}</FieldRow>
            <FieldRow label="設立年">{company.foundedYear ? `${company.foundedYear}年` : null}</FieldRow>
            <FieldRow label="年商">{fmtCurrency(company.annualRevenue)}</FieldRow>
            <FieldRow label="資本金">{fmtCurrency(company.capital)}</FieldRow>
            <FieldRow label="証券取引所">{company.stockMarket}</FieldRow>
            <FieldRow label="証券コード">{company.stockSymbol}</FieldRow>
            <FieldRow label="法人番号">{company.corporateNumber}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      <LightningCard>
        <LightningCardHeader title="財務・契約情報" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="ARR">{fmtCurrency(company.arr)}</FieldRow>
            <FieldRow label="MRR">{fmtCurrency(company.mrr)}</FieldRow>
            <FieldRow label="アクティブ契約額">{fmtCurrency(company.activeContractValue)}</FieldRow>
            <FieldRow label="更新予定日">{fmtDate(company.renewalDate)}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      <LightningCard>
        <LightningCardHeader title="所在地" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="請求先住所">{billingAddr || null}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      {(company.childCompanies ?? []).length > 0 && (
        <LightningCard>
          <LightningCardHeader title="子会社" count={company.childCompanies!.length} />
          <ul className="divide-y divide-sf-border">
            {company.childCompanies!.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <RecordLink objectApiName="Company" recordId={c.id} label={c.companyName} />
                {c.tier && TIER_MAP[c.tier] && (
                  <Badge variant={TIER_MAP[c.tier].variant}>{TIER_MAP[c.tier].label}</Badge>
                )}
              </li>
            ))}
          </ul>
        </LightningCard>
      )}

      {company.description && (
        <LightningCard>
          <LightningCardHeader title="説明" />
          <LightningCardBody>
            <p className="text-sm text-sf-text whitespace-pre-wrap">{company.description}</p>
          </LightningCardBody>
        </LightningCard>
      )}
    </div>
  );
}

// ── Tab: 関係者 ────────────────────────────────────────────────────────────

function StakeholdersTab({ company }: { company: Company }) {
  const stakeholders = company.accountStakeholders ?? [];
  const relationships = [
    ...(company.sourceRelationships ?? []).map((r) => ({
      id: r.id,
      type: r.relationshipType,
      company: r.targetCompany,
      direction: "→" as const,
    })),
    ...(company.targetRelationships ?? []).map((r) => ({
      id: r.id,
      type: r.relationshipType,
      company: r.sourceCompany,
      direction: "←" as const,
    })),
  ];

  const attitudeVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
    CHAMPION: "success", SUPPORTER: "success", NEUTRAL: "muted",
    SKEPTIC: "warning", BLOCKER: "danger",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Contacts */}
      <LightningCard>
        <LightningCardHeader
          title="担当者 / Contacts"
          count={company.contacts.length}
          action={<AddButton href={`/contacts/new?companyId=${company.id}`} />}
        />
        {company.contacts.length === 0 ? (
          <LightningCardBody><EmptyState title="担当者が登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["氏名", "役職", "メール", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {company.contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <RecordLink objectApiName="Contact" recordId={c.id} label={c.fullName} />
                    </td>
                    <td className="px-4 py-2.5 text-sf-weak">{c.role ?? c.title ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-sf-weak hover:text-primary-600 text-xs">
                          {c.email}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.isPrimary && <Badge variant="brand">主担当</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

      {/* Account Team */}
      <LightningCard>
        <LightningCardHeader
          title="社内取引先チーム"
          count={company.accountTeamMembers.length}
        />
        {company.accountTeamMembers.length === 0 ? (
          <LightningCardBody><EmptyState title="取引先チームが登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["ユーザー", "役割", "部署", "メール"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {company.accountTeamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <span className="text-2xs font-bold text-primary-700">{(m.user.name ?? "?")[0]}</span>
                        </div>
                        <div>
                          <UserLink userId={m.user.id} name={m.user.name} />
                          {m.user.title && <p className="text-xs text-sf-weak">{m.user.title}</p>}
                        </div>
                        {m.isPrimary && <Badge variant="brand">主担当</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sf-weak text-xs">{TEAM_ROLE_MAP[m.role] ?? m.role}</td>
                    <td className="px-4 py-2.5 text-sf-weak text-xs">{m.user.department ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {m.user.email ? (
                        <a href={`mailto:${m.user.email}`} className="text-xs text-sf-weak hover:text-primary-600">
                          {m.user.email}
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

      {/* Stakeholders */}
      {stakeholders.length > 0 && (
        <LightningCard>
          <LightningCardHeader title="ステークホルダー" count={stakeholders.length} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["担当者", "意思決定役割", "スタンス", "影響力", "メモ"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {stakeholders.map((s) => (
                  <tr key={s.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <RecordLink objectApiName="Contact" recordId={s.contact.id} label={s.contact.fullName} />
                      {s.contact.title && <p className="text-xs text-sf-weak">{s.contact.title}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sf-weak">{s.decisionRole}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={attitudeVariant[s.attitude] ?? "muted"}>{s.attitude}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-sf-weak">{s.influenceLevel}</td>
                    <td className="px-4 py-2.5 text-xs text-sf-weak max-w-[200px] truncate">{s.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LightningCard>
      )}

      {/* Company relationships */}
      {relationships.length > 0 && (
        <LightningCard>
          <LightningCardHeader title="企業関係" count={relationships.length} />
          <ul className="divide-y divide-sf-border">
            {relationships.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-sf-weak font-mono w-4 shrink-0">{r.direction}</span>
                <RecordLink objectApiName="Company" recordId={r.company.id} label={r.company.companyName} />
                <Badge variant="muted">{r.type}</Badge>
              </li>
            ))}
          </ul>
        </LightningCard>
      )}
    </div>
  );
}

// ── Tab: 営業 ──────────────────────────────────────────────────────────────

function SalesTab({ company }: { company: Company }) {
  const deals = company.deals ?? [];
  const openDeals  = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const wonDeals   = deals.filter((d) => d.stage === "won");
  const totalPipeline = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalWon      = wonDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const now = new Date();

  const RISK_CLS: Record<string, string> = {
    LOW: "text-success", MEDIUM: "text-warning", HIGH: "text-danger", CRITICAL: "text-danger font-bold",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="パイプライン"   value={fmtCompact(totalPipeline)} tone="brand"    emphasis="medium" />
        <MetricCard label="受注金額"       value={fmtCompact(totalWon)}      tone="success"  emphasis="medium" />
        <MetricCard label="進行中商談"     value={`${openDeals.length}件`}    tone="neutral"  emphasis="low" />
        <MetricCard label="商談数（合計）" value={`${deals.length}件`}        tone="neutral"  emphasis="low" />
      </div>

      {/* Deals table */}
      <LightningCard>
        <LightningCardHeader
          title="商談一覧"
          count={deals.length}
          action={<AddButton href={`/deals/new?companyId=${company.id}`} label="新規商談" />}
        />
        {deals.length === 0 ? (
          <LightningCardBody><EmptyState title="商談が登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["商談名", "ステージ", "担当者", "金額", "確度", "クローズ予定", "最終活動", "次回アクション"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {deals.map((d) => {
                  const stageInfo = DEAL_STAGE_MAP[d.stage] ?? { label: d.stage, variant: "muted" as const };
                  const lastAct   = d.lastActivityAt ? new Date(d.lastActivityAt) : null;
                  const daysSince = lastAct ? Math.floor((now.getTime() - lastAct.getTime()) / 86400000) : null;
                  const stale     = daysSince == null || daysSince > 30;
                  return (
                    <tr key={d.id} className="hover:bg-sf-bg/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <RecordLink objectApiName="Deal" recordId={d.id} label={d.dealName} />
                        {d.riskLevel && d.riskLevel !== "LOW" && (
                          <span className={`ml-1 text-xs ${RISK_CLS[d.riskLevel] ?? ""}`}>▲</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5"><Badge variant={stageInfo.variant}>{stageInfo.label}</Badge></td>
                      <td className="px-4 py-2.5">
                        {d.owner ? (
                          <UserLink userId={d.owner.id} name={d.owner.name} className="text-sm whitespace-nowrap" />
                        ) : <span className="text-xs text-sf-weak">未設定</span>}
                      </td>
                      <td className="px-4 py-2.5 text-sm tabular-nums">{d.amount != null ? fmtCurrency(d.amount) : "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak">{d.probability != null ? `${d.probability}%` : "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak whitespace-nowrap">{fmtDate(d.expectedCloseDate)}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={stale ? "text-danger whitespace-nowrap" : "text-sf-weak whitespace-nowrap"}>
                          {daysSince != null ? `${daysSince}日前` : "なし"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-sf-weak max-w-[140px] truncate">
                        {d.nextAction ?? <span className="text-warning">未設定</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>
    </div>
  );
}

// ── Tab: マーケティング ────────────────────────────────────────────────────

function MarketingTab({ company }: { company: Company }) {
  const campaigns = company.campaigns ?? [];

  return (
    <div className="p-6 space-y-4">
      <LightningCard>
        <LightningCardHeader
          title="キャンペーン"
          count={campaigns.length}
          action={<AddButton href={`/campaigns/new?companyId=${company.id}`} />}
        />
        {campaigns.length === 0 ? (
          <LightningCardBody><EmptyState title="キャンペーンが登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["キャンペーン名", "種別", "ステータス"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <RecordLink objectApiName="Campaign" recordId={c.id} label={c.name} />
                    </td>
                    <td className="px-4 py-2.5 text-sf-weak">{c.type ?? "—"}</td>
                    <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>
    </div>
  );
}

// ── Tab: 契約・利用 ────────────────────────────────────────────────────────

function ContractsTab({ company }: { company: Company }) {
  const contracts = company.contracts ?? [];
  const orders    = company.orders ?? [];

  const CONTRACT_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "muted" | "info"> = {
    Active:    "success",
    Expired:   "muted",
    Cancelled: "danger",
    Draft:     "info",
  };

  // 顧客化前の企業は契約を持たない
  if (!isCustomerCompany(company)) {
    return (
      <div className="p-6">
        <LightningCard>
          <LightningCardBody>
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-sf-text">受注後に契約・注文が表示されます</p>
              <p className="text-xs text-sf-weak mt-1">
                {LIFECYCLE_LABEL[company.lifecycleStage ?? ""] ?? "見込み"}段階のため、契約・注文はありません。
              </p>
            </div>
          </LightningCardBody>
        </LightningCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="アクティブ契約"
          value={`${contracts.filter(c => c.status === "Active").length}件`}
          tone="success"
          emphasis="medium"
        />
        <MetricCard
          label="注文数"
          value={`${orders.length}件`}
          tone="neutral"
          emphasis="low"
        />
      </div>

      {/* Contracts */}
      <LightningCard>
        <LightningCardHeader
          title="契約"
          count={contracts.length}
          action={<AddButton href={`/contracts/new?companyId=${company.id}`} />}
        />
        {contracts.length === 0 ? (
          <LightningCardBody><EmptyState title="契約が登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["契約番号", "ステータス", "開始日", "終了日", "金額"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      {/* 契約番号 → /contracts/[id] リンク */}
                      <RecordLink
                        objectApiName="Contract"
                        recordId={c.id}
                        label={c.contractNumber ?? `#${c.id.slice(0, 8)}`}
                        className="font-mono text-sm"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={CONTRACT_STATUS_VARIANT[c.status] ?? "info"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-sf-weak">{fmtDate(c.startDate)}</td>
                    <td className="px-4 py-2.5 text-sf-weak">{fmtDate(c.endDate)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{c.value != null ? fmtCurrency(c.value) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

      {/* Orders */}
      <LightningCard>
        <LightningCardHeader
          title="注文"
          count={orders.length}
          action={<AddButton href={`/orders/new?companyId=${company.id}`} />}
        />
        {orders.length === 0 ? (
          <LightningCardBody><EmptyState title="注文が登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["注文番号", "ステータス", "金額"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-sf-bg/50 transition-colors">
                    <td className="px-4 py-2.5">
                      {/* 注文番号 → /orders/[id] リンク */}
                      <RecordLink
                        objectApiName="Order"
                        recordId={o.id}
                        label={o.orderNumber ?? `#${o.id.slice(0, 8)}`}
                        className="font-mono text-sm"
                      />
                    </td>
                    <td className="px-4 py-2.5"><Badge variant="info">{o.status}</Badge></td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {o.totalAmount != null ? fmtCurrency(o.totalAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

      {/* File attachments */}
      <FileAttachmentsCard apiBase={`/api/companies/${company.id}/files`} />
    </div>
  );
}

// ── Tab: サポート ──────────────────────────────────────────────────────────

function SupportTab({ company }: { company: Company }) {
  const cases = company.cases ?? [];
  const openCases   = cases.filter((c) => c.status !== "Closed");
  const criticalCases = cases.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH" || c.priority === "Critical" || c.priority === "High");

  const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "muted"> = {
    CRITICAL: "danger", HIGH: "danger", MEDIUM: "warning", LOW: "muted",
    Critical: "danger", High: "danger", Medium: "warning", Low: "muted",
  };
  const PRIORITY_LABEL: Record<string, string> = {
    CRITICAL: "緊急", HIGH: "高", MEDIUM: "中", LOW: "低",
    Critical: "緊急", High: "高", Medium: "中", Low: "低",
  };

  // 顧客化前の企業はサポートケースを持たない
  if (!isCustomerCompany(company)) {
    return (
      <div className="p-6">
        <LightningCard>
          <LightningCardBody>
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-sf-text">この取引先はまだ顧客化していないため、サポートケースはありません</p>
              <p className="text-xs text-sf-weak mt-1">
                受注・オンボーディング完了後にサポートケースが作成されます。
              </p>
            </div>
          </LightningCardBody>
        </LightningCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          label="未解決ケース"
          value={`${openCases.length}件`}
          tone={openCases.length > 0 ? "danger" : "neutral"}
          emphasis="medium"
        />
        <MetricCard
          label="高優先度ケース"
          value={`${criticalCases.length}件`}
          tone={criticalCases.length > 0 ? "warning" : "neutral"}
          emphasis="low"
        />
        <MetricCard label="ケース合計" value={`${cases.length}件`} tone="neutral" emphasis="low" />
      </div>

      {/* Cases table */}
      <LightningCard>
        <LightningCardHeader
          title="ケース一覧"
          count={cases.length}
          action={<AddButton href={`/cases/new?companyId=${company.id}`} label="新規ケース" />}
        />
        {cases.length === 0 ? (
          <LightningCardBody><EmptyState title="ケースが登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["ケース番号", "件名", "優先度", "ステータス", "登録日"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-sf-bg/50 transition-colors ${
                      c.priority === "CRITICAL" ? "bg-danger-light/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-sf-weak whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="px-4 py-2.5">
                      {/* ケース件名 → /cases/[id] リンク */}
                      <RecordLink objectApiName="Case" recordId={c.id} label={c.subject} />
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={PRIORITY_VARIANT[c.priority] ?? "muted"}>
                        {PRIORITY_LABEL[c.priority] ?? c.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
                    <td className="px-4 py-2.5 text-xs text-sf-weak">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>
    </div>
  );
}

// ── Tab: 活動 ──────────────────────────────────────────────────────────────

function ActivityTab({ company }: { company: Company }) {
  const [filter, setFilter] = useState<string>("all");

  const activities = [...(company.activities ?? [])]
    .sort((a, b) => new Date(b.activityDate ?? b.createdAt).getTime() - new Date(a.activityDate ?? a.createdAt).getTime())
    .map((a) => ({ ...a, subject: a.subject ?? "", activityDate: a.activityDate ?? a.createdAt }));

  const filtered = filter === "all"
    ? activities
    : activities.filter((a) => a.type.toLowerCase() === filter);

  const tasks = (company.tasks ?? []).sort(
    (a, b) => (a.dueDate && b.dueDate ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0)
  );

  const FILTER_OPTIONS = [
    { id: "all",     label: "すべて" },
    { id: "meeting", label: "会議" },
    { id: "phone",   label: "電話" },
    { id: "email",   label: "メール" },
    { id: "note",    label: "メモ" },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Activity timeline */}
      <LightningCard>
        <LightningCardHeader
          title={`活動履歴 (${activities.length})`}
          action={<AddButton href={`/activities/new?companyId=${company.id}`} label="活動記録" />}
        />
        {/* Filter tabs */}
        <div className="px-4 py-2 border-b border-sf-border flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f.id
                  ? "bg-primary-500 text-white"
                  : "bg-sf-bg text-sf-weak hover:bg-sf-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ActivityTimeline activities={filtered} emptyMessage="活動記録がありません" />
      </LightningCard>

      {/* Tasks */}
      <LightningCard>
        <LightningCardHeader
          title={`タスク (${tasks.length})`}
          action={<AddButton href={`/tasks/new?companyId=${company.id}`} />}
        />
        {tasks.length === 0 ? (
          <LightningCardBody><EmptyState title="タスクが登録されていません" compact /></LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["タイトル", "優先度", "ステータス", "期限", "担当者"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-sf-weak uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {tasks.map((t) => {
                  const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";
                  return (
                    <tr key={t.id} className={`hover:bg-sf-bg/50 transition-colors ${overdue ? "bg-danger-light/10" : ""}`}>
                      <td className="px-4 py-2.5 font-medium">{t.title}</td>
                      <td className="px-4 py-2.5">
                        {t.priority && (
                          <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "muted"}>
                            {t.priority === "high" ? "高" : t.priority === "medium" ? "中" : "低"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={t.status === "done" ? "success" : t.status === "in_progress" ? "info" : "muted"}>
                          {t.status === "done" ? "完了" : t.status === "in_progress" ? "進行中" : "未着手"}
                        </Badge>
                      </td>
                      <td className={`px-4 py-2.5 text-xs whitespace-nowrap ${overdue ? "text-danger font-semibold" : "text-sf-weak"}`}>
                        {fmtDate(t.dueDate)}{overdue && " ⚠"}
                      </td>
                      <td className="px-4 py-2.5">
                        {t.assignee ? (
                          <UserLink userId={t.assignee.id!} name={t.assignee.name} className="text-xs" />
                        ) : <span className="text-xs text-sf-weak">未設定</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>
    </div>
  );
}

// ── Tab: インサイト ────────────────────────────────────────────────────────

function InsightsTab({
  company,
  onDismissInsight,
}: {
  company: Company;
  onDismissInsight: (id: string) => void;
}) {
  const insights  = company.accountInsights ?? [];
  const snapshots = [...(company.accountHealthSnapshots ?? [])]
    .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
    .slice(0, 10);

  const insightTypeIcon: Record<string, string> = {
    RISK: "⚠", OPPORTUNITY: "💡", SUPPORT: "🎧", RENEWAL: "📅", ENGAGEMENT: "📊",
  };
  const severityVariant: Record<string, "danger" | "warning" | "info" | "muted"> = {
    HIGH: "danger", MEDIUM: "warning", LOW: "info", INFO: "muted",
  };
  const severityLabel: Record<string, string> = {
    HIGH: "高", MEDIUM: "中", LOW: "低", INFO: "情報",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Insights */}
      <LightningCard>
        <LightningCardHeader title="インサイト" count={insights.length} />
        {insights.length === 0 ? (
          <LightningCardBody><EmptyState title="インサイトがありません" compact /></LightningCardBody>
        ) : (
          <ul className="divide-y divide-sf-border">
            {insights.map((ins) => (
              <li key={ins.id} className={`flex items-start gap-3 px-4 py-3 ${ins.isDismissed ? "opacity-40" : ""}`}>
                <span className="text-lg shrink-0 mt-0.5">{insightTypeIcon[ins.type] ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-sf-text">{ins.title}</p>
                    <Badge variant={severityVariant[ins.severity] ?? "muted"}>
                      {severityLabel[ins.severity] ?? ins.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-sf-weak">{ins.body}</p>
                  {ins.actionLabel && ins.actionUrl && !ins.isDismissed && (
                    <a href={ins.actionUrl} className="text-xs text-primary-500 hover:underline mt-1 inline-block">
                      {ins.actionLabel} →
                    </a>
                  )}
                  <p className="text-2xs text-sf-placeholder mt-1">{fmtDate(ins.createdAt)}</p>
                </div>
                <button
                  onClick={() => onDismissInsight(ins.id)}
                  className="shrink-0 text-sf-weak hover:text-sf-text transition-colors"
                  aria-label={ins.isDismissed ? "再表示" : "非表示"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {ins.isDismissed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </LightningCard>

      {/* Health snapshots */}
      {snapshots.length > 0 && (
        <LightningCard>
          <LightningCardHeader title="ヘルス履歴" count={snapshots.length} />
          <ul className="divide-y divide-sf-border">
            {snapshots.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-2.5">
                <span className="text-sm font-bold tabular-nums w-8 text-right text-sf-text">{s.healthScore}</span>
                <Badge variant={s.riskLevel === "HIGH" ? "danger" : s.riskLevel === "MEDIUM" ? "warning" : "success"}>
                  {s.riskLevel === "HIGH" ? "高" : s.riskLevel === "MEDIUM" ? "中" : "低"}リスク
                </Badge>
                <span className="text-xs text-sf-weak ml-auto">{fmtDate(s.measuredAt)}</span>
              </li>
            ))}
          </ul>
        </LightningCard>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const showToast = useToast();
  const [company, setCompany]     = useState<Company | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${id}`);
      if (!res.ok) { setCompany(null); setLoading(false); return; }
      setCompany(await res.json());
    } catch {
      showToast("データの取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleDismissInsight = async (insightId: string) => {
    try {
      await fetch(`/api/companies/${id}/insights/${insightId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      setCompany((prev) =>
        prev ? {
          ...prev,
          accountInsights: prev.accountInsights.map((ins) =>
            ins.id === insightId ? { ...ins, isDismissed: true } : ins
          ),
        } : prev
      );
    } catch { showToast("操作に失敗しました", "error"); }
  };

  if (loading)  return <PageLoading />;
  if (!company) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sf-weak">見つかりません</p>
    </div>
  );

  const rollup = company._rollup ?? {
    contactsCount: 0, openDealsCount: 0, openPipelineAmount: 0,
    wonAmount: 0, activeCasesCount: 0, activeContractsCount: 0, highScoreLeadsCount: 0,
  };
  const tierInfo   = company.tier   ? TIER_MAP[company.tier]     : null;
  const statusInfo = company.status ? STATUS_MAP[company.status] : null;
  const avatarBg   = company.tier   ? (TIER_AVATAR_COLOR[company.tier] ?? "bg-blue-500") : "bg-blue-500";
  const score      = company.healthScore ?? 0;
  const healthAccent = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  const healthLabel  = score >= 80 ? "良好"   : score >= 60 ? "注意"   : "要対応";

  void avatarBg; // used in header avatar color

  return (
    <div className="min-h-screen bg-sf-bg">
      {/* ── Record header ─────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border">
        {/* Breadcrumb */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 text-xs text-sf-weak">
          <Link href="/companies" className="hover:text-primary-500 hover:underline">顧客企業</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text truncate max-w-xs">{company.companyName}</span>
        </div>

        {/* Title row */}
        <div className="px-6 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ObjectIcon objectType="Company" size="sm" />
            <div>
              <h1 className="text-xl font-bold text-sf-text leading-tight">{company.companyName}</h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {statusInfo && <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>}
                {company.type && <Badge variant={isCustomerCompany(company) ? "success" : "info"}>{TYPE_LABEL[company.type] ?? company.type}</Badge>}
                {company.lifecycleStage && LIFECYCLE_LABEL[company.lifecycleStage] && (
                  <Badge variant="muted">{LIFECYCLE_LABEL[company.lifecycleStage]}</Badge>
                )}
                {company.industry && <span className="text-xs text-sf-weak">{company.industry}</span>}
                {tierInfo && <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>}
              </div>
              {company.lastActivityAt && (
                <p className="text-xs text-sf-weak mt-0.5">最終活動: {fmtDate(company.lastActivityAt)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/activities/new?companyId=${id}`}>
              <Button variant="secondary" size="sm">活動記録</Button>
            </Link>
            <Link href={`/tasks/new?companyId=${id}`}>
              <Button variant="secondary" size="sm">タスク</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/companies/${id}/edit`)}>
              編集
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => router.push("/settings/object-manager/Company/record-pages")}
              title="ページを編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Metrics strip — lifecycle-aware */}
        <div className="px-6 pb-4 pt-3 border-t border-sf-border/60">
          <MetricStrip
            items={isCustomerCompany(company) ? [
              // 顧客企業向けKPI
              {
                label: "ARR",
                value: fmtCompact(company.arr),
                sub: company.arr ? `MRR ${fmtCompact(company.mrr)}` : "—",
                emphasis: "high",
              },
              {
                label: "パイプライン",
                value: fmtCompact(rollup.openPipelineAmount),
                sub: `進行中 ${rollup.openDealsCount}件`,
                emphasis: "medium",
              },
              {
                label: "アクティブ契約",
                value: `${rollup.activeContractsCount}件`,
                emphasis: "medium",
              },
              {
                label: "未解決ケース",
                value: `${rollup.activeCasesCount}件`,
                sub: rollup.activeCasesCount > 0 ? "対応が必要です" : "問題なし",
                tone: rollup.activeCasesCount > 0 ? "danger" : "neutral",
                emphasis: "medium",
              },
              {
                label: "ヘルススコア",
                value: company.healthScore != null ? String(company.healthScore) : "—",
                sub: company.healthScore != null ? healthLabel : "データなし",
                tone: healthAccent === "danger" ? "danger" : healthAccent === "warning" ? "warning" : "success",
                emphasis: "medium",
              },
              {
                label: "受注累計",
                value: fmtCompact(rollup.wonAmount),
                emphasis: "low",
              },
            ] : [
              // 見込み・プロスペクト企業向けKPI
              {
                label: "パイプライン",
                value: fmtCompact(rollup.openPipelineAmount),
                sub: `進行中 ${rollup.openDealsCount}件`,
                emphasis: "high",
              },
              {
                label: "リード数",
                value: `${rollup.highScoreLeadsCount}件`,
                sub: "スコア70以上",
                emphasis: "medium",
              },
              {
                label: "コンタクト数",
                value: `${rollup.contactsCount}名`,
                emphasis: "medium",
              },
              {
                label: "最終活動",
                value: company.lastActivityAt ? fmtDate(company.lastActivityAt) : "—",
                emphasis: "low",
              },
            ]}
          />
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border sticky top-0 z-10">
        <div className="px-6 flex items-end gap-0 overflow-x-auto" role="tablist" aria-label="取引先詳細タブ">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────── */}
      <div role="tabpanel">
        {activeTab === "overview"     && (
          <OverviewTab company={company} onDismissInsight={handleDismissInsight} onTabChange={setActiveTab} />
        )}
        {activeTab === "details"      && <DetailsTab company={company} />}
        {activeTab === "stakeholders" && <StakeholdersTab company={company} />}
        {activeTab === "sales"        && <SalesTab company={company} />}
        {activeTab === "marketing"    && <MarketingTab company={company} />}
        {activeTab === "contracts"    && <ContractsTab company={company} />}
        {activeTab === "support"      && <SupportTab company={company} />}
        {activeTab === "activity"     && <ActivityTab company={company} />}
        {activeTab === "insights"     && (
          <InsightsTab company={company} onDismissInsight={handleDismissInsight} />
        )}
      </div>
    </div>
  );
}
