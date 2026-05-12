"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { StagePath } from "@/components/ui/stage-path";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/ui/status-badges";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, formatAmount, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  dealName: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  nextAction: string | null;
  memo: string | null;
  createdAt: string;
  company: { id: string; companyName: string };
  contact: { id: string; fullName: string } | null;
  activities: Array<{
    id: string;
    type: string;
    subject: string;
    body?: string | null;
    activityDate: string;
    company: { id: string; companyName: string } | null;
    contact: { id: string; fullName: string } | null;
    deal: { id: string; dealName: string } | null;
  }>;
  tasks: Array<{
    id: string; title: string; dueDate: string | null; status: string; priority: string;
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
            <div className="w-10 h-10 rounded-sf bg-primary-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
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
          {deal.contact && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">担当者</dt>
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
