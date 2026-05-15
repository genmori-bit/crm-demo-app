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
import { KpiCard } from "@/components/ui/kpi-card";

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
  contacts: { id: string; fullName: string; email?: string; role?: string; isPrimary?: boolean }[];
  deals: { id: string; name: string; stage: string; amount?: number; closeDate?: string; probability?: number }[];
  tasks: { id: string; title: string; status: string; dueDate?: string; priority?: string }[];
  cases: { id: string; caseNumber: string; subject: string; status: string; priority: string; createdAt: string }[];
  campaigns: { id: string; name: string; status: string; type?: string }[];
  contracts: { id: string; contractNumber?: string; status: string; startDate?: string; endDate?: string; value?: number }[];
  orders: { id: string; orderNumber?: string; status: string; totalAmount?: number }[];
  activities: { id: string; type: string; subject?: string; body?: string; createdAt: string }[];
  accountTeamMembers: { id: string; role: string; isPrimary: boolean; user: { id: string; name: string; email: string; department?: string } }[];
  accountInsights: { id: string; type: string; title: string; body: string; severity: string; source: string; actionLabel?: string; actionUrl?: string; isDismissed: boolean; createdAt: string }[];
  accountPlans: { id: string; name: string; fiscalYear: string; status: string; summary?: string }[];
  accountStakeholders: { id: string; influenceLevel: string; attitude: string; decisionRole: string; notes?: string; contact: { id: string; fullName: string; email?: string; role?: string } }[];
  accountHealthSnapshots: { id: string; healthScore: number; riskLevel: string; measuredAt: string }[];
  sourceRelationships: { id: string; relationshipType: string; targetCompany: { id: string; companyName: string } }[];
  targetRelationships: { id: string; relationshipType: string; sourceCompany: { id: string; companyName: string } }[];
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

// ── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "概要" },
  { id: "details",   label: "詳細" },
  { id: "related",   label: "関連" },
  { id: "activity",  label: "活動" },
  { id: "deals",     label: "商談" },
  { id: "support",   label: "サポート" },
  { id: "contracts", label: "契約・注文" },
  { id: "insights",  label: "インサイト" },
];

const TIER_MAP: Record<string, { label: string; variant: "danger" | "warning" | "info" | "muted" }> = {
  STRATEGIC: { label: "戦略", variant: "danger" },
  ENTERPRISE: { label: "大手", variant: "warning" },
  MID_MARKET: { label: "中堅", variant: "info" },
  SMB: { label: "中小", variant: "muted" },
};

const STATUS_MAP: Record<string, { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }> = {
  TARGET: { label: "ターゲット", variant: "muted" },
  APPROACHING: { label: "アプローチ中", variant: "info" },
  ACTIVE_DEAL: { label: "商談中", variant: "warning" },
  CUSTOMER: { label: "顧客", variant: "success" },
  DORMANT: { label: "休眠", variant: "muted" },
  CHURNED: { label: "解約", variant: "danger" },
};

const DEAL_STAGE_MAP: Record<string, { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }> = {
  "Prospecting": { label: "見込み", variant: "muted" },
  "Qualification": { label: "検討中", variant: "info" },
  "Needs Analysis": { label: "ニーズ確認", variant: "info" },
  "Proposal": { label: "提案", variant: "warning" },
  "Negotiation": { label: "交渉", variant: "warning" },
  "Closed Won": { label: "受注", variant: "success" },
  "Closed Lost": { label: "失注", variant: "danger" },
};

const TIER_AVATAR_COLOR: Record<string, string> = {
  STRATEGIC: "bg-red-500",
  ENTERPRISE: "bg-orange-500",
  MID_MARKET: "bg-blue-500",
  SMB: "bg-gray-400",
};

const TEAM_ROLE_MAP: Record<string, string> = {
  OWNER: "オーナー",
  ACCOUNT_MANAGER: "担当営業",
  CSM: "CS担当",
  SE: "SE",
  PARTNER: "パートナー",
  EXECUTIVE: "エグゼクティブ",
};

// ── Helper Components ──────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-sf-border/60 last:border-0">
      <dt className="text-xs text-sf-weak w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text flex-1 break-words">{children || "—"}</dd>
    </div>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ja-JP");
}

function fmtCurrency(n?: number | null): string {
  if (n == null) return "—";
  return `¥${n.toLocaleString()}`;
}

function fmtCompact(n?: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "¥0";
  const abs = Math.abs(n);
  if (abs >= 1_0000_0000) return `¥${(n / 1_0000_0000).toFixed(abs % 1_0000_0000 === 0 ? 0 : 1)}億`;
  if (abs >= 1_0000)      return `¥${(n / 1_0000).toFixed(abs % 1_0000 === 0 ? 0 : 1)}万`;
  return `¥${n.toLocaleString()}`;
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

// ── Tab Content Components ─────────────────────────────────────────────────

function OverviewTab({
  company,
  onDismissInsight,
}: {
  company: Company;
  onDismissInsight: (insightId: string) => void;
}) {
  const activeInsights = (company.accountInsights ?? []).filter((i) => !i.isDismissed).slice(0, 3);
  const openDeals = (company.deals ?? []).filter(
    (d) => !["Closed Won", "Closed Lost"].includes(d.stage)
  ).slice(0, 5);
  const topContacts = (company.contacts ?? []).slice(0, 5);
  const topTasks = (company.tasks ?? []).filter((t) => t.status !== "COMPLETED").slice(0, 3);
  const recentActivities = (company.activities ?? []).slice(0, 5);

  const healthColor =
    (company.healthScore ?? 0) >= 80
      ? "text-success"
      : (company.healthScore ?? 0) >= 60
      ? "text-warning"
      : "text-danger";

  const insightBg: Record<string, string> = {
    HIGH: "bg-danger-light border-danger-border text-danger",
    MEDIUM: "bg-warning-light border-warning-border text-warning",
    LOW: "bg-info-light border-info-border text-info",
    INFO: "bg-sf-bg border-sf-border text-sf-weak",
  };

  const activityTypeIcon: Record<string, React.ReactNode> = {
    NOTE: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    CALL: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    MEETING: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    EMAIL: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };

  const latestSnapshot = (company.accountHealthSnapshots ?? []).sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
  )[0];

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Insight banners */}
        {activeInsights.length > 0 && (
          <div className="space-y-2">
            {activeInsights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-3 rounded-sf border ${insightBg[insight.severity] ?? insightBg.INFO}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{insight.body}</p>
                  {insight.actionLabel && insight.actionUrl && (
                    <a href={insight.actionUrl} className="text-xs underline mt-1 inline-block">
                      {insight.actionLabel}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => onDismissInsight(insight.id)}
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
        <LightningCard>
          <LightningCardHeader title="企業概要" />
          <LightningCardBody>
            {company.businessSummary ? (
              <p className="text-sm text-sf-text whitespace-pre-wrap">{company.businessSummary}</p>
            ) : (
              <p className="text-sm text-sf-weak">—</p>
            )}
            {[
              ...(company.technologies ?? []),
              ...(company.painPoints ?? []),
              ...(company.objectives ?? []),
            ].length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(company.technologies ?? []).map((t) => (
                  <Badge key={t} variant="info">{t}</Badge>
                ))}
                {(company.painPoints ?? []).map((t) => (
                  <Badge key={t} variant="warning">{t}</Badge>
                ))}
                {(company.objectives ?? []).map((t) => (
                  <Badge key={t} variant="success">{t}</Badge>
                ))}
              </div>
            )}
          </LightningCardBody>
        </LightningCard>

        {/* Open deals */}
        <LightningCard>
          <LightningCardHeader
            title="進行中商談"
            count={openDeals.length}
            action={<AddButton href={`/deals/new?companyId=${company.id}`} label="新規商談" />}
          />
          {openDeals.length === 0 ? (
            <LightningCardBody>
              <EmptyState title="進行中の商談はありません" compact />
            </LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {openDeals.map((deal) => {
                const stageInfo = DEAL_STAGE_MAP[deal.stage] ?? { label: deal.stage, variant: "default" as const };
                return (
                  <li key={deal.id}>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-sf-bg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sf-text truncate">{deal.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={stageInfo.variant}>{stageInfo.label}</Badge>
                          {deal.closeDate && (
                            <span className="text-xs text-sf-weak">{fmtDate(deal.closeDate)}</span>
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

        {/* Contacts */}
        <LightningCard>
          <LightningCardHeader
            title="担当者"
            count={topContacts.length}
            action={<AddButton href={`/contacts/new?companyId=${company.id}`} />}
          />
          {topContacts.length === 0 ? (
            <LightningCardBody>
              <EmptyState title="担当者が登録されていません" compact />
            </LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {topContacts.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-sf-bg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-600">{c.fullName[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-sf-text truncate">{c.fullName}</p>
                        {c.isPrimary && (
                          <Badge variant="brand">主担当</Badge>
                        )}
                      </div>
                      {c.role && <p className="text-xs text-sf-weak truncate">{c.role}</p>}
                      {c.email && <p className="text-xs text-primary-500 truncate">{c.email}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </LightningCard>
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        {/* Health card */}
        <LightningCard>
          <LightningCardHeader title="取引先ヘルス" />
          <LightningCardBody>
            <div className="text-center mb-4">
              <p className={`text-5xl font-bold tabular-nums ${healthColor}`}>
                {company.healthScore ?? "—"}
              </p>
              <p className="text-xs text-sf-weak mt-1">ヘルススコア</p>
              {latestSnapshot && (
                <div className="mt-2">
                  <Badge
                    variant={
                      latestSnapshot.riskLevel === "HIGH"
                        ? "danger"
                        : latestSnapshot.riskLevel === "MEDIUM"
                        ? "warning"
                        : "success"
                    }
                  >
                    {latestSnapshot.riskLevel === "HIGH"
                      ? "高リスク"
                      : latestSnapshot.riskLevel === "MEDIUM"
                      ? "中リスク"
                      : "低リスク"}
                  </Badge>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-sf-weak">フィットスコア</span>
                <span className="font-semibold text-sf-text">{company.fitScore ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-sf-weak">エンゲージメントスコア</span>
                <span className="font-semibold text-sf-text">{company.engagementScore ?? "—"}</span>
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        {/* Account team */}
        {(company.accountTeamMembers ?? []).length > 0 && (
          <LightningCard>
            <LightningCardHeader title="取引先チーム" />
            <ul className="divide-y divide-sf-border">
              {company.accountTeamMembers.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-sf-bg border border-sf-border flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-sf-text">{m.user.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-sf-text truncate">{m.user.name}</p>
                    <p className="text-xs text-sf-weak">{TEAM_ROLE_MAP[m.role] ?? m.role}</p>
                  </div>
                  {m.isPrimary && <Badge variant="brand">主担当</Badge>}
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
            action={<AddButton href={`/tasks/new?companyId=${company.id}`} />}
          />
          {topTasks.length === 0 ? (
            <LightningCardBody>
              <p className="text-xs text-sf-weak text-center py-3">タスクなし</p>
            </LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {topTasks.map((t) => {
                const isOverdue =
                  t.dueDate && new Date(t.dueDate) < new Date();
                return (
                  <li key={t.id} className="px-4 py-2.5">
                    <p className="text-sm text-sf-text truncate">{t.title}</p>
                    {t.dueDate && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? "text-danger font-semibold" : "text-sf-weak"}`}>
                        {fmtDate(t.dueDate)}
                        {isOverdue && " (期限超過)"}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </LightningCard>

        {/* Recent activities */}
        <LightningCard>
          <LightningCardHeader title="最近の活動" count={recentActivities.length} />
          {recentActivities.length === 0 ? (
            <LightningCardBody>
              <p className="text-xs text-sf-weak text-center py-3">活動記録なし</p>
            </LightningCardBody>
          ) : (
            <ul className="divide-y divide-sf-border">
              {recentActivities.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className="text-sf-weak mt-0.5 shrink-0">
                    {activityTypeIcon[a.type] ?? activityTypeIcon.NOTE}
                  </span>
                  <div className="min-w-0 flex-1">
                    {a.subject && (
                      <p className="text-xs font-medium text-sf-text truncate">{a.subject}</p>
                    )}
                    <p className="text-xs text-sf-weak">{fmtDate(a.createdAt)}</p>
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

function DetailsTab({ company }: { company: Company }) {
  const billingAddr = [
    company.billingPostalCode && `〒${company.billingPostalCode}`,
    company.billingPrefecture,
    company.billingCity,
    company.billingAddress,
    company.billingCountry,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      {/* Basic info */}
      <LightningCard>
        <LightningCardHeader title="基本情報" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="企業名">{company.companyName}</FieldRow>
            <FieldRow label="正式名称">{company.legalName}</FieldRow>
            <FieldRow label="表示名">{company.displayName}</FieldRow>
            <FieldRow label="ウェブサイト">
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">
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
          </dl>
        </LightningCardBody>
      </LightningCard>

      {/* Company attributes */}
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

      {/* Financial / contract */}
      <LightningCard>
        <LightningCardHeader title="財務・契約" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="ARR">{fmtCurrency(company.arr)}</FieldRow>
            <FieldRow label="MRR">{fmtCurrency(company.mrr)}</FieldRow>
            <FieldRow label="アクティブ契約額">{fmtCurrency(company.activeContractValue)}</FieldRow>
            <FieldRow label="更新予定日">{fmtDate(company.renewalDate)}</FieldRow>
            <FieldRow label="ライフサイクルステージ">{company.lifecycleStage}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      {/* Address */}
      <LightningCard>
        <LightningCardHeader title="所在地" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="請求先住所">{billingAddr || null}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>

      {/* Other */}
      <LightningCard>
        <LightningCardHeader title="その他" />
        <LightningCardBody noPadding>
          <dl className="px-4">
            <FieldRow label="ソース">{company.source}</FieldRow>
            <FieldRow label="親会社">
              {company.parentCompany ? (
                <Link href={`/companies/${company.parentCompany.id}`} className="text-primary-500 hover:underline">
                  {company.parentCompany.companyName}
                </Link>
              ) : null}
            </FieldRow>
            <FieldRow label="説明">{company.description}</FieldRow>
          </dl>
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}

function RelatedTab({ company }: { company: Company }) {
  const sections = [
    {
      title: "担当者",
      count: company.contacts?.length ?? 0,
      newHref: `/contacts/new?companyId=${company.id}`,
      items: (company.contacts ?? []).slice(0, 10),
      empty: "担当者が登録されていません",
      renderRow: (c: Company["contacts"][0]) => (
        <tr key={c.id} className="hover:bg-sf-bg transition-colors">
          <td className="px-4 py-2.5">
            <Link href={`/contacts/${c.id}`} className="text-primary-500 hover:underline font-medium text-sm">
              {c.fullName}
            </Link>
          </td>
          <td className="px-4 py-2.5 text-sm text-sf-weak">{c.email ?? "—"}</td>
          <td className="px-4 py-2.5 text-sm text-sf-weak">{c.role ?? "—"}</td>
          <td className="px-4 py-2.5">
            {c.isPrimary && <Badge variant="brand">主担当</Badge>}
          </td>
        </tr>
      ),
      headers: ["名前", "メール", "役職", ""],
    },
    {
      title: "商談",
      count: company.deals?.length ?? 0,
      newHref: `/deals/new?companyId=${company.id}`,
      items: (company.deals ?? []).slice(0, 10),
      empty: "商談が登録されていません",
      renderRow: (d: Company["deals"][0]) => {
        const stageInfo = DEAL_STAGE_MAP[d.stage] ?? { label: d.stage, variant: "default" as const };
        return (
          <tr key={d.id} className="hover:bg-sf-bg transition-colors">
            <td className="px-4 py-2.5">
              <Link href={`/deals/${d.id}`} className="text-primary-500 hover:underline font-medium text-sm">
                {d.name}
              </Link>
            </td>
            <td className="px-4 py-2.5">
              <Badge variant={stageInfo.variant}>{stageInfo.label}</Badge>
            </td>
            <td className="px-4 py-2.5 text-sm tabular-nums">{d.amount != null ? fmtCurrency(d.amount) : "—"}</td>
            <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(d.closeDate)}</td>
          </tr>
        );
      },
      headers: ["名前", "ステージ", "金額", "クローズ予定日"],
    },
    {
      title: "キャンペーン",
      count: company.campaigns?.length ?? 0,
      newHref: `/campaigns/new?companyId=${company.id}`,
      items: (company.campaigns ?? []).slice(0, 10),
      empty: "キャンペーンが登録されていません",
      renderRow: (c: Company["campaigns"][0]) => (
        <tr key={c.id} className="hover:bg-sf-bg transition-colors">
          <td className="px-4 py-2.5 text-sm font-medium text-sf-text">{c.name}</td>
          <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
          <td className="px-4 py-2.5 text-sm text-sf-weak">{c.type ?? "—"}</td>
        </tr>
      ),
      headers: ["名前", "ステータス", "種別"],
    },
    {
      title: "ケース",
      count: company.cases?.length ?? 0,
      newHref: `/cases/new?companyId=${company.id}`,
      items: (company.cases ?? []).slice(0, 10),
      empty: "ケースが登録されていません",
      renderRow: (c: Company["cases"][0]) => (
        <tr key={c.id} className="hover:bg-sf-bg transition-colors">
          <td className="px-4 py-2.5 text-sm text-sf-weak font-mono">{c.caseNumber}</td>
          <td className="px-4 py-2.5 text-sm font-medium text-sf-text">{c.subject}</td>
          <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
          <td className="px-4 py-2.5">
            <Badge variant={c.priority === "HIGH" || c.priority === "CRITICAL" ? "danger" : "muted"}>
              {c.priority}
            </Badge>
          </td>
        </tr>
      ),
      headers: ["ケース番号", "件名", "ステータス", "優先度"],
    },
    {
      title: "契約",
      count: company.contracts?.length ?? 0,
      newHref: `/contracts/new?companyId=${company.id}`,
      items: (company.contracts ?? []).slice(0, 10),
      empty: "契約が登録されていません",
      renderRow: (c: Company["contracts"][0]) => (
        <tr key={c.id} className="hover:bg-sf-bg transition-colors">
          <td className="px-4 py-2.5 text-sm font-mono text-sf-weak">{c.contractNumber ?? "—"}</td>
          <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
          <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(c.startDate)} — {fmtDate(c.endDate)}</td>
          <td className="px-4 py-2.5 text-sm tabular-nums">{c.value != null ? fmtCurrency(c.value) : "—"}</td>
        </tr>
      ),
      headers: ["契約番号", "ステータス", "期間", "金額"],
    },
    {
      title: "注文",
      count: company.orders?.length ?? 0,
      newHref: `/orders/new?companyId=${company.id}`,
      items: (company.orders ?? []).slice(0, 10),
      empty: "注文が登録されていません",
      renderRow: (o: Company["orders"][0]) => (
        <tr key={o.id} className="hover:bg-sf-bg transition-colors">
          <td className="px-4 py-2.5 text-sm font-mono text-sf-weak">{o.orderNumber ?? "—"}</td>
          <td className="px-4 py-2.5"><Badge variant="info">{o.status}</Badge></td>
          <td className="px-4 py-2.5 text-sm tabular-nums">{o.totalAmount != null ? fmtCurrency(o.totalAmount) : "—"}</td>
        </tr>
      ),
      headers: ["注文番号", "ステータス", "金額"],
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {sections.map((s) => (
        <LightningCard key={s.title}>
          <LightningCardHeader
            title={s.title}
            count={s.count}
            action={<AddButton href={s.newHref} />}
          />
          {s.items.length === 0 ? (
            <LightningCardBody>
              <EmptyState title={s.empty} compact />
            </LightningCardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-sf-bg border-b border-sf-border">
                    {s.headers.map((h) => (
                      <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {s.items.map((item) => s.renderRow(item as never))}
                </tbody>
              </table>
              {s.count > 10 && (
                <div className="px-4 py-2 border-t border-sf-border">
                  <span className="text-xs text-primary-500 hover:underline cursor-pointer">
                    すべて表示 ({s.count}件)
                  </span>
                </div>
              )}
            </div>
          )}
        </LightningCard>
      ))}
    </div>
  );
}

function ActivityTab({ company }: { company: Company }) {
  const activities = [...(company.activities ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const typeLabel: Record<string, string> = {
    NOTE: "メモ",
    CALL: "電話",
    MEETING: "ミーティング",
    EMAIL: "メール",
  };

  return (
    <div className="p-6">
      <LightningCard>
        <LightningCardHeader
          title="活動履歴"
          count={activities.length}
          action={<AddButton href={`/activities/new?companyId=${company.id}`} label="活動記録" />}
        />
        {activities.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="活動記録がありません" compact />
          </LightningCardBody>
        ) : (
          <ul className="divide-y divide-sf-border">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-sf-bg border border-sf-border flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-sf-weak">{(typeLabel[a.type] ?? a.type)[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="muted">{typeLabel[a.type] ?? a.type}</Badge>
                    <span className="text-xs text-sf-weak">{fmtDate(a.createdAt)}</span>
                  </div>
                  {a.subject && <p className="text-sm font-medium text-sf-text">{a.subject}</p>}
                  {a.body && (
                    <p className="text-xs text-sf-weak mt-0.5 line-clamp-2">{a.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </LightningCard>
    </div>
  );
}

function DealsTab({ company }: { company: Company }) {
  const deals = company.deals ?? [];
  const openDeals = deals.filter((d) => !["Closed Won", "Closed Lost"].includes(d.stage));
  const totalPipeline = openDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const wonDeals = deals.filter((d) => d.stage === "Closed Won");
  const totalWon = wonDeals.reduce((s, d) => s + (d.amount ?? 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label="パイプライン" value={fmtCurrency(totalPipeline)} accent="primary" />
        <KpiCard label="受注金額" value={fmtCurrency(totalWon)} accent="success" />
        <KpiCard label="商談数" value={`${deals.length}件`} accent="default" />
      </div>
      <LightningCard>
        <LightningCardHeader
          title="商談一覧"
          count={deals.length}
          action={<AddButton href={`/deals/new?companyId=${company.id}`} label="新規商談作成" />}
        />
        {deals.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="商談が登録されていません" compact />
          </LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["名前", "ステージ", "金額", "確度", "クローズ予定日"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {deals.map((d) => {
                  const stageInfo = DEAL_STAGE_MAP[d.stage] ?? { label: d.stage, variant: "default" as const };
                  return (
                    <tr key={d.id} className="hover:bg-sf-bg transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/deals/${d.id}`} className="text-primary-500 hover:underline font-medium text-sm">
                          {d.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5"><Badge variant={stageInfo.variant}>{stageInfo.label}</Badge></td>
                      <td className="px-4 py-2.5 text-sm tabular-nums">{d.amount != null ? fmtCurrency(d.amount) : "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak">{d.probability != null ? `${d.probability}%` : "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(d.closeDate)}</td>
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

function SupportTab({ company }: { company: Company }) {
  const cases = company.cases ?? [];

  return (
    <div className="p-6 space-y-4">
      <LightningCard>
        <LightningCardHeader
          title="ケース一覧"
          count={cases.length}
          action={<AddButton href={`/cases/new?companyId=${company.id}`} label="新規ケース" />}
        />
        {cases.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="ケースが登録されていません" compact />
          </LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["ケース番号", "件名", "優先度", "ステータス", "登録日"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-sf-bg transition-colors ${
                      c.priority === "HIGH" || c.priority === "CRITICAL" ? "bg-danger-light/30" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-sm font-mono text-sf-weak">{c.caseNumber}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-sf-text">{c.subject}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.priority === "HIGH" || c.priority === "CRITICAL" ? "danger" : "muted"}>
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
                    <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(c.createdAt)}</td>
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

function ContractsTab({ company }: { company: Company }) {
  const contracts = company.contracts ?? [];
  const orders = company.orders ?? [];

  return (
    <div className="p-6 space-y-4">
      <LightningCard>
        <LightningCardHeader
          title="契約"
          count={contracts.length}
          action={<AddButton href={`/contracts/new?companyId=${company.id}`} />}
        />
        {contracts.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="契約が登録されていません" compact />
          </LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["契約番号", "ステータス", "開始日", "終了日", "金額"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-2.5 text-sm font-mono text-sf-weak">{c.contractNumber ?? "—"}</td>
                    <td className="px-4 py-2.5"><Badge variant="info">{c.status}</Badge></td>
                    <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(c.startDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-sf-weak">{fmtDate(c.endDate)}</td>
                    <td className="px-4 py-2.5 text-sm tabular-nums">{c.value != null ? fmtCurrency(c.value) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

      <LightningCard>
        <LightningCardHeader
          title="注文"
          count={orders.length}
          action={<AddButton href={`/orders/new?companyId=${company.id}`} />}
        />
        {orders.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="注文が登録されていません" compact />
          </LightningCardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sf-bg border-b border-sf-border">
                  {["注文番号", "ステータス", "金額"].map((h) => (
                    <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-2.5 text-sm font-mono text-sf-weak">{o.orderNumber ?? "—"}</td>
                    <td className="px-4 py-2.5"><Badge variant="info">{o.status}</Badge></td>
                    <td className="px-4 py-2.5 text-sm tabular-nums">{o.totalAmount != null ? fmtCurrency(o.totalAmount) : "—"}</td>
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

function InsightsTab({
  company,
  onDismissInsight,
}: {
  company: Company;
  onDismissInsight: (insightId: string) => void;
}) {
  const insights = company.accountInsights ?? [];
  const snapshots = [...(company.accountHealthSnapshots ?? [])].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
  ).slice(0, 10);
  const stakeholders = company.accountStakeholders ?? [];

  const insightTypeIcon: Record<string, string> = {
    RISK: "⚠",
    OPPORTUNITY: "💡",
    SUPPORT: "🎧",
    RENEWAL: "📅",
    ENGAGEMENT: "📊",
  };

  const severityVariant: Record<string, "danger" | "warning" | "info" | "muted"> = {
    HIGH: "danger",
    MEDIUM: "warning",
    LOW: "info",
    INFO: "muted",
  };

  const attitudeVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
    CHAMPION: "success",
    SUPPORTER: "success",
    NEUTRAL: "muted",
    SKEPTIC: "warning",
    BLOCKER: "danger",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Insights */}
      <LightningCard>
        <LightningCardHeader title="インサイト" count={insights.length} />
        {insights.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="インサイトがありません" compact />
          </LightningCardBody>
        ) : (
          <ul className="divide-y divide-sf-border">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className={`flex items-start gap-3 px-4 py-3 ${insight.isDismissed ? "opacity-40" : ""}`}
              >
                <span className="text-lg shrink-0 mt-0.5">{insightTypeIcon[insight.type] ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-sf-text">{insight.title}</p>
                    <Badge variant={severityVariant[insight.severity] ?? "muted"}>{insight.severity}</Badge>
                    <Badge variant="muted">{insight.type}</Badge>
                  </div>
                  <p className="text-xs text-sf-weak">{insight.body}</p>
                  {insight.actionLabel && insight.actionUrl && !insight.isDismissed && (
                    <a href={insight.actionUrl} className="text-xs text-primary-500 hover:underline mt-1 inline-block">
                      {insight.actionLabel}
                    </a>
                  )}
                  <p className="text-xs text-sf-placeholder mt-1">{fmtDate(insight.createdAt)}</p>
                </div>
                <button
                  onClick={() => onDismissInsight(insight.id)}
                  className="shrink-0 text-sf-weak hover:text-sf-text transition-colors"
                  title={insight.isDismissed ? "再表示" : "非表示"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {insight.isDismissed ? (
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
      <LightningCard>
        <LightningCardHeader title="ヘルス履歴" count={snapshots.length} />
        {snapshots.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="ヘルス履歴がありません" compact />
          </LightningCardBody>
        ) : (
          <ul className="divide-y divide-sf-border">
            {snapshots.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-2.5">
                <span className="text-sm font-bold tabular-nums w-8 text-right text-sf-text">{s.healthScore}</span>
                <Badge
                  variant={
                    s.riskLevel === "HIGH" ? "danger" : s.riskLevel === "MEDIUM" ? "warning" : "success"
                  }
                >
                  {s.riskLevel === "HIGH" ? "高" : s.riskLevel === "MEDIUM" ? "中" : "低"}リスク
                </Badge>
                <span className="text-xs text-sf-weak ml-auto">{fmtDate(s.measuredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </LightningCard>

      {/* Stakeholders */}
      <LightningCard>
        <LightningCardHeader title="ステークホルダー" count={stakeholders.length} />
        {stakeholders.length === 0 ? (
          <LightningCardBody>
            <EmptyState title="ステークホルダーが登録されていません" compact />
          </LightningCardBody>
        ) : (
          <ul className="divide-y divide-sf-border">
            {stakeholders.map((s) => (
              <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary-600">{s.contact.fullName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/contacts/${s.contact.id}`} className="text-sm font-semibold text-primary-500 hover:underline">
                      {s.contact.fullName}
                    </Link>
                    <Badge variant={attitudeVariant[s.attitude] ?? "muted"}>{s.attitude}</Badge>
                  </div>
                  <p className="text-xs text-sf-weak">{s.decisionRole} · 影響力: {s.influenceLevel}</p>
                  {s.notes && <p className="text-xs text-sf-weak mt-0.5 line-clamp-2">{s.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </LightningCard>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setCompany(null);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data: Company = await res.json();
      setCompany(data);
    } catch {
      showToast("データの取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDismissInsight = async (insightId: string) => {
    try {
      await fetch(`/api/companies/${id}/insights/${insightId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      setCompany((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accountInsights: prev.accountInsights.map((ins) =>
            ins.id === insightId ? { ...ins, isDismissed: true } : ins
          ),
        };
      });
    } catch {
      showToast("操作に失敗しました", "error");
    }
  };

  if (loading) return <PageLoading />;

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sf-weak">見つかりません</p>
      </div>
    );
  }

  const rollup = company._rollup ?? {
    contactsCount: 0,
    openDealsCount: 0,
    openPipelineAmount: 0,
    wonAmount: 0,
    activeCasesCount: 0,
    activeContractsCount: 0,
    highScoreLeadsCount: 0,
  };

  const tierInfo = company.tier ? TIER_MAP[company.tier] : null;
  const statusInfo = company.status ? STATUS_MAP[company.status] : null;
  const avatarColor = company.tier ? (TIER_AVATAR_COLOR[company.tier] ?? "bg-blue-500") : "bg-blue-500";

  const healthAccent =
    (company.healthScore ?? 0) >= 80 ? "success" : (company.healthScore ?? 0) >= 60 ? "warning" : "danger";

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
            {/* Avatar */}
            <div
              className={`w-12 h-12 rounded-sf ${avatarColor} flex items-center justify-center shrink-0`}
            >
              <span className="text-xl font-bold text-white">
                {company.companyName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-sf-text leading-tight">{company.companyName}</h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {statusInfo && <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>}
                {company.type && <Badge variant="muted">{company.type}</Badge>}
                {company.industry && <span className="text-xs text-sf-weak">{company.industry}</span>}
                {tierInfo && <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>}
              </div>
              {company.lastActivityAt && (
                <p className="text-xs text-sf-weak mt-0.5">
                  最終活動: {fmtDate(company.lastActivityAt)}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
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
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings/object-manager/Company/record-pages")}
              title="ページを編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* KPI highlight strip */}
        <div className="px-6 pb-4 border-t border-sf-border/60 pt-3">
          <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard
              label="商談パイプライン"
              value={fmtCompact(rollup.openPipelineAmount)}
              sub={`¥${rollup.openPipelineAmount.toLocaleString()}`}
              accent="primary"
            />
            <KpiCard
              label="進行中商談"
              value={`${rollup.openDealsCount}件`}
              accent="primary"
              href="/deals"
            />
            <KpiCard
              label="受注金額"
              value={fmtCompact(rollup.wonAmount)}
              sub={`¥${rollup.wonAmount.toLocaleString()}`}
              accent="success"
            />
            <KpiCard
              label="ARR"
              value={fmtCompact(company.arr ?? 0)}
              sub={company.arr ? `¥${company.arr.toLocaleString()}` : undefined}
              accent="success"
            />
            <KpiCard
              label="アクティブ契約"
              value={`${rollup.activeContractsCount}件`}
              accent="default"
            />
            <KpiCard
              label="未解決ケース"
              value={`${rollup.activeCasesCount}件`}
              accent={rollup.activeCasesCount > 0 ? "warning" : "default"}
            />
            <KpiCard
              label="ヘルススコア"
              value={company.healthScore ?? "—"}
              accent={healthAccent}
            />
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border sticky top-0 z-10">
        <div className="px-6 flex items-end gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
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
      {activeTab === "overview" && (
        <OverviewTab company={company} onDismissInsight={handleDismissInsight} />
      )}
      {activeTab === "details" && <DetailsTab company={company} />}
      {activeTab === "related" && <RelatedTab company={company} />}
      {activeTab === "activity" && <ActivityTab company={company} />}
      {activeTab === "deals" && <DealsTab company={company} />}
      {activeTab === "support" && <SupportTab company={company} />}
      {activeTab === "contracts" && <ContractsTab company={company} />}
      {activeTab === "insights" && (
        <InsightsTab company={company} onDismissInsight={handleDismissInsight} />
      )}
    </div>
  );
}
