"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { StagePath } from "@/components/ui/stage-path";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { TaskPriorityBadge } from "@/components/ui/status-badges";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, formatAmount, isOverdue } from "@/lib/utils";
import { FileAttachmentsCard } from "@/components/ui/file-attachments-card";
import { cn } from "@/lib/utils";
import { ObjectIcon } from "@/components/ui/object-icon";

interface Deal {
  id: string;
  dealName: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  nextAction: string | null;
  nextStep: string | null;
  memo: string | null;
  lostReason: string | null;
  ownerId: string | null;
  riskLevel: string | null;
  riskReason: string | null;
  lastActivityAt: string | null;
  activityCount: number;
  meetingCount: number;
  callCount: number;
  emailCount: number;
  createdAt: string;
  company: { id: string; companyName: string };
  contact: { id: string; fullName: string } | null;
  owner: { id: string; name: string | null; department: string | null } | null;
  salesRep: { id: string; name: string | null } | null;
  salesEngineer: { id: string; name: string | null } | null;
  teamMembers: Array<{
    id: string; role: string; isPrimary: boolean;
    user: { id: string; name: string | null; title: string | null };
  }>;
  activities: Array<{
    id: string;
    type: string;
    subject: string;
    body?: string | null;
    outcome?: string | null;
    durationMinutes?: number | null;
    activityDate: string;
    owner?: { id: string; name: string | null } | null;
    company: { id: string; companyName: string } | null;
    contact: { id: string; fullName: string } | null;
    deal: { id: string; dealName: string } | null;
  }>;
  tasks: Array<{
    id: string; title: string; dueDate: string | null; status: string; priority: string;
    assignee?: { id: string; name: string | null } | null;
  }>;
}

function ProbabilityBar({ value }: { value: number }) {
  const color = value >= 75 ? "#2e844a" : value >= 50 ? "#0176d3" : value >= 25 ? "#dd7a01" : "#706e6b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-sf-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold text-sf-text w-10 text-right">{value}%</span>
    </div>
  );
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Deal>(`/api/deals/${id}`).then(setDeal);
  }, [id]);

  const handleStageChange = async (stage: string) => {
    if (!deal) return;
    try {
      await api.patch(`/api/deals/${id}`, { stage });
      setDeal({ ...deal, stage });
      showToast(`ステージを「${stage}」に更新しました`);
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/deals/${id}`);
      showToast("商談を削除しました");
      router.push("/deals");
    } catch {
      showToast("削除に失敗しました", "error");
      setDeleting(false);
    }
  };

  if (!deal) return <PageLoading />;

  const pendingTasks = deal.tasks.filter((t) => t.status !== "done");
  const doneTasks = deal.tasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-screen">
      {/* ── Record header ─────────────────────────────── */}
      <div className="bg-sf-surface border-b border-sf-border">
        {/* Breadcrumb */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 text-xs text-sf-weak">
          <Link href="/deals" className="hover:text-primary-500 hover:underline">商談</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text truncate max-w-xs">{deal.dealName}</span>
        </div>

        {/* Title row */}
        <div className="px-6 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ObjectIcon objectType="Deal" size="sm" />
            <div>
              <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">商談</p>
              <h1 className="text-xl font-bold text-sf-text leading-tight">{deal.dealName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/deals/${id}/edit`)}>編集</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>削除</Button>
          </div>
        </div>

        {/* Stage path */}
        <StagePath currentStage={deal.stage} onStageChange={handleStageChange} />

        {/* Key fields strip */}
        <div className="px-6 py-3 bg-sf-bg/50 flex flex-wrap gap-x-8 gap-y-2 border-t border-sf-border">
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">金額</dt>
            <dd className="text-xl font-bold text-sf-text">{formatAmount(deal.amount)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">確度</dt>
            <dd className="w-32 mt-1"><ProbabilityBar value={deal.probability} /></dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">クローズ予定日</dt>
            <dd className="text-sm font-semibold text-sf-text">{formatDate(deal.expectedCloseDate) || "-"}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">顧客企業</dt>
            <dd className="text-sm font-semibold">
              <Link href={`/companies/${deal.company.id}`} className="text-primary-500 hover:underline">
                {deal.company.companyName}
              </Link>
            </dd>
          </div>
          {/* Owner - linked to /users/[id] */}
          {deal.owner && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">商談担当者</dt>
              <dd className="text-sm font-semibold">
                <Link href={`/users/${deal.owner.id}`} className="text-primary-500 hover:underline">
                  {deal.owner.name}
                </Link>
                {deal.owner.department && (
                  <span className="text-xs text-sf-weak ml-1">({deal.owner.department})</span>
                )}
              </dd>
            </div>
          )}
          {deal.salesEngineer && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">SE</dt>
              <dd className="text-sm font-semibold">
                <Link href={`/users/${deal.salesEngineer.id}`} className="text-primary-500 hover:underline">
                  {deal.salesEngineer.name}
                </Link>
              </dd>
            </div>
          )}
          {/* Risk level */}
          {deal.riskLevel && deal.riskLevel !== "LOW" && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">リスク</dt>
              <dd className={cn(
                "text-sm font-semibold",
                deal.riskLevel === "CRITICAL" ? "text-danger" :
                deal.riskLevel === "HIGH" ? "text-danger" :
                "text-warning"
              )}>
                ▲ {deal.riskLevel === "CRITICAL" ? "緊急" : deal.riskLevel === "HIGH" ? "高" : "中"}
                {deal.riskReason && <span className="font-normal text-xs ml-1">({deal.riskReason})</span>}
              </dd>
            </div>
          )}
          {deal.contact && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">主要担当者</dt>
              <dd className="text-sm font-semibold">
                <Link href={`/contacts/${deal.contact.id}`} className="text-primary-500 hover:underline">
                  {deal.contact.fullName}
                </Link>
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="p-6">
        <div className="flex gap-5">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Deal detail card */}
            <LightningCard>
              <LightningCardHeader title="商談情報" />
              <LightningCardBody>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <dt className="text-xs font-medium text-sf-weak mb-0.5">次回アクション</dt>
                    <dd className="text-sm text-sf-text">{deal.nextAction || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sf-weak mb-0.5">登録日</dt>
                    <dd className="text-sm text-sf-text">{formatDate(deal.createdAt)}</dd>
                  </div>
                </dl>
                {deal.memo && (
                  <div className="mt-4 pt-4 border-t border-sf-border">
                    <dt className="text-xs font-medium text-sf-weak mb-1.5">メモ</dt>
                    <dd className="text-sm text-sf-text whitespace-pre-wrap bg-sf-bg/60 rounded-sf px-3 py-2.5 border border-sf-border">
                      {deal.memo}
                    </dd>
                  </div>
                )}
              </LightningCardBody>
            </LightningCard>

            {/* Activity timeline */}
            <LightningCard>
              <LightningCardHeader
                title={`活動履歴 (${deal.activities.length})`}
                action={
                  <Link
                    href={`/activities/new?dealId=${id}&companyId=${deal.company.id}`}
                    className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    追加
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <ActivityTimeline activities={deal.activities} />
            </LightningCard>
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Key metrics */}
            <LightningCard>
              <LightningCardHeader title="主要指標" />
              <LightningCardBody noPadding>
                <dl className="divide-y divide-sf-border">
                  {[
                    {
                      label: "金額",
                      value: (
                        <span className="text-base font-bold text-sf-text">{formatAmount(deal.amount)}</span>
                      ),
                    },
                    {
                      label: "確度",
                      value: <ProbabilityBar value={deal.probability} />,
                    },
                    {
                      label: "受注見込み",
                      value: (
                        <span className="text-sm font-semibold text-success">
                          {formatAmount(Math.round((deal.amount * deal.probability) / 100))}
                        </span>
                      ),
                    },
                    {
                      label: "クローズ予定",
                      value: (
                        <span className={cn(
                          "text-sm font-medium",
                          deal.expectedCloseDate && isOverdue(deal.expectedCloseDate) && deal.stage !== "won" && deal.stage !== "lost"
                            ? "text-danger"
                            : "text-sf-text"
                        )}>
                          {formatDate(deal.expectedCloseDate) || "-"}
                        </span>
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-4 py-3">
                      <dt className="text-xs font-medium text-sf-weak mb-1">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </LightningCardBody>
            </LightningCard>

            {/* Tasks */}
            <LightningCard>
              <LightningCardHeader
                title={`タスク (${deal.tasks.length})`}
                action={
                  <Link
                    href={`/tasks/new?dealId=${id}`}
                    className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    追加
                  </Link>
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              />
              {deal.tasks.length === 0 ? (
                <LightningCardBody>
                  <p className="text-sm text-sf-weak text-center py-3">タスクがありません</p>
                </LightningCardBody>
              ) : (
                <div>
                  {pendingTasks.length > 0 && (
                    <ul className="divide-y divide-sf-border">
                      {pendingTasks.map((t) => {
                        const overdue = t.dueDate && isOverdue(t.dueDate);
                        return (
                          <li key={t.id} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                "w-4 h-4 rounded border-2 mt-0.5 shrink-0",
                                "border-sf-border"
                              )} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-sf-text leading-snug">{t.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <TaskPriorityBadge priority={t.priority} />
                                  {t.dueDate && (
                                    <span className={cn(
                                      "text-2xs",
                                      overdue ? "text-danger font-semibold" : "text-sf-weak"
                                    )}>
                                      {formatDate(t.dueDate)}
                                      {overdue && " !"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {doneTasks.length > 0 && (
                    <div className="px-4 py-2 border-t border-sf-border bg-sf-bg/40">
                      <p className="text-2xs text-sf-weak">完了済み {doneTasks.length}件</p>
                    </div>
                  )}
                </div>
              )}
            </LightningCard>

            {/* Opportunity Team */}
            {deal.teamMembers && deal.teamMembers.length > 0 && (
              <LightningCard>
                <LightningCardHeader
                  title={`商談チーム (${deal.teamMembers.length})`}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
                <LightningCardBody noPadding>
                  <ul className="divide-y divide-sf-border">
                    {deal.teamMembers.map((m) => {
                      const roleLabel: Record<string, string> = {
                        SALES_REP: "営業担当",
                        SALES_ENGINEER: "SE",
                        MANAGER: "マネージャー",
                        EXECUTIVE: "エグゼクティブ",
                        SUPPORT: "サポート",
                      };
                      return (
                        <li key={m.id} className="px-4 py-2.5 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-2xs font-bold text-primary-700">
                              {m.user.name?.charAt(0) ?? "?"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/users/${m.user.id}`}
                              className="text-xs font-semibold text-primary-600 hover:underline block truncate"
                            >
                              {m.user.name}
                            </Link>
                            <p className="text-2xs text-sf-weak">
                              {roleLabel[m.role] ?? m.role}
                              {m.user.title && ` · ${m.user.title}`}
                            </p>
                          </div>
                          {m.isPrimary && (
                            <span className="text-2xs font-semibold text-primary-600 bg-primary-50 border border-primary-200 rounded px-1.5 py-0.5 shrink-0">
                              主担当
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </LightningCardBody>
              </LightningCard>
            )}

            {/* File Attachments */}
            <FileAttachmentsCard apiBase={`/api/deals/${id}/files`} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="商談の削除"
        message={`「${deal.dealName}」を削除しますか？`}
        loading={deleting}
      />
    </div>
  );
}
