"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { RecordTabs, TabPanel } from "@/components/ui/record-tabs";
import { RelatedList } from "@/components/ui/related-list";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { CompanyStatusBadge, DealStageBadge, TaskStatusBadge, TaskPriorityBadge } from "@/components/ui/status-badges";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, formatAmount } from "@/lib/utils";

interface Company {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  employeeSize: string | null;
  status: string;
  ownerName: string | null;
  memo: string | null;
  createdAt: string;
  contacts: Array<{
    id: string;
    fullName: string;
    title: string | null;
    department: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
  }>;
  deals: Array<{
    id: string;
    dealName: string;
    stage: string;
    amount: number;
    probability: number;
    expectedCloseDate: string | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    subject: string;
    body?: string | null;
    activityDate: string;
    contact: { id: string; fullName: string } | null;
    company: { id: string; companyName: string } | null;
    deal: { id: string; dealName: string } | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    status: string;
    priority: string;
  }>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-sf-border last:border-0 grid grid-cols-[9rem_1fr] gap-3 items-start">
      <dt className="text-xs font-medium text-sf-weak pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text">{children || <span className="text-sf-weak">-</span>}</dd>
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Company>(`/api/companies/${id}`).then(setCompany);
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/companies/${id}`);
      showToast("顧客企業を削除しました");
      router.push("/companies");
    } catch {
      showToast("削除に失敗しました", "error");
      setDeleting(false);
    }
  };

  if (!company) return <PageLoading />;

  const activeDeals = company.deals.filter((d) => !["won", "lost"].includes(d.stage));
  const totalDealAmount = activeDeals.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen">
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
            <div className="w-10 h-10 rounded-sf bg-primary-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">顧客企業</p>
              <h1 className="text-xl font-bold text-sf-text leading-tight">{company.companyName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/activities/new?companyId=${id}`}>
              <Button variant="secondary" size="sm">活動追加</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/companies/${id}/edit`)}>編集</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>削除</Button>
          </div>
        </div>

        {/* Highlight panel */}
        <div className="px-6 py-3 border-t border-sf-border bg-sf-bg/40 flex flex-wrap gap-x-8 gap-y-2">
          {[
            {
              label: "ステータス",
              value: <CompanyStatusBadge status={company.status} />,
            },
            { label: "業界", value: company.industry },
            { label: "従業員規模", value: company.employeeSize },
            { label: "担当者", value: company.ownerName },
            {
              label: "進行中商談",
              value: activeDeals.length > 0 ? (
                <span className="text-sm font-semibold text-primary-600">{activeDeals.length}件 / {formatAmount(totalDealAmount)}</span>
              ) : "0件",
            },
            { label: "登録日", value: formatDate(company.createdAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">{label}</dt>
              <dd className="text-sm font-medium text-sf-text">{value ?? <span className="text-sf-weak">-</span>}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <RecordTabs
        tabs={[
          { id: "detail", label: "詳細" },
          { id: "related", label: "関連", count: company.deals.length + company.tasks.length },
          { id: "activity", label: "活動履歴", count: company.activities.length },
        ]}
        defaultTab="detail"
      >
        {/* ── 詳細 tab ── */}
        <TabPanel id="detail">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: field groups */}
            <div className="lg:col-span-2 space-y-4">
              <LightningCard>
                <LightningCardHeader title="基本情報" />
                <LightningCardBody noPadding>
                  <dl className="px-4">
                    <FieldRow label="ステータス">
                      <CompanyStatusBadge status={company.status} />
                    </FieldRow>
                    <FieldRow label="業界">{company.industry}</FieldRow>
                    <FieldRow label="従業員規模">{company.employeeSize}</FieldRow>
                    <FieldRow label="担当者">{company.ownerName}</FieldRow>
                    <FieldRow label="Webサイト">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:underline break-all"
                        >
                          {company.website}
                        </a>
                      ) : null}
                    </FieldRow>
                    <FieldRow label="登録日">{formatDate(company.createdAt)}</FieldRow>
                  </dl>
                </LightningCardBody>
              </LightningCard>

              {company.memo && (
                <LightningCard>
                  <LightningCardHeader title="メモ" />
                  <LightningCardBody>
                    <p className="text-sm text-sf-text whitespace-pre-wrap">{company.memo}</p>
                  </LightningCardBody>
                </LightningCard>
              )}
            </div>

            {/* Right: contacts */}
            <div className="space-y-4">
              <LightningCard>
                <LightningCardHeader
                  title={`担当者 (${company.contacts.length})`}
                  action={
                    <Link
                      href={`/contacts/new?companyId=${id}`}
                      className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      追加
                    </Link>
                  }
                />
                {company.contacts.length === 0 ? (
                  <LightningCardBody>
                    <p className="text-sm text-sf-weak text-center py-4">担当者が登録されていません</p>
                  </LightningCardBody>
                ) : (
                  <ul className="divide-y divide-sf-border">
                    {company.contacts.map((c) => (
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
                                <span className="text-2xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-semibold shrink-0">主担当</span>
                              )}
                            </div>
                            <p className="text-xs text-sf-weak truncate">
                              {[c.department, c.title].filter(Boolean).join(" · ") || "-"}
                            </p>
                            {c.email && <p className="text-xs text-primary-500 truncate">{c.email}</p>}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </LightningCard>
            </div>
          </div>
        </TabPanel>

        {/* ── 関連 tab ── */}
        <TabPanel id="related">
          <div className="p-6 space-y-4">
            <RelatedList
              title="商談"
              newHref={`/deals/new?companyId=${id}`}
              columns={[
                {
                  key: "dealName",
                  label: "商談名",
                  render: (d) => (
                    <Link href={`/deals/${d.id}`} className="font-semibold text-primary-500 hover:underline">
                      {d.dealName}
                    </Link>
                  ),
                },
                {
                  key: "stage",
                  label: "ステージ",
                  render: (d) => <DealStageBadge stage={d.stage} />,
                },
                {
                  key: "amount",
                  label: "金額",
                  render: (d) => (
                    <span className="font-semibold">{formatAmount(d.amount)}</span>
                  ),
                },
                {
                  key: "probability",
                  label: "確度",
                  render: (d) => <span className="text-sf-text">{d.probability}%</span>,
                },
                {
                  key: "expectedCloseDate",
                  label: "クローズ予定",
                  render: (d) => <span className="text-sf-weak">{formatDate(d.expectedCloseDate)}</span>,
                },
              ]}
              items={company.deals}
              getRowKey={(d) => d.id}
              emptyMessage="商談が登録されていません"
            />

            <RelatedList
              title="タスク"
              newHref={`/tasks/new?companyId=${id}`}
              columns={[
                {
                  key: "title",
                  label: "タイトル",
                  render: (t) => <span className="font-medium text-sf-text">{t.title}</span>,
                },
                {
                  key: "priority",
                  label: "優先度",
                  render: (t) => <TaskPriorityBadge priority={t.priority} />,
                },
                {
                  key: "status",
                  label: "ステータス",
                  render: (t) => <TaskStatusBadge status={t.status} />,
                },
                {
                  key: "dueDate",
                  label: "期限",
                  render: (t) => <span className="text-sf-weak">{formatDate(t.dueDate)}</span>,
                },
              ]}
              items={company.tasks}
              getRowKey={(t) => t.id}
              emptyMessage="タスクが登録されていません"
            />
          </div>
        </TabPanel>

        {/* ── 活動履歴 tab ── */}
        <TabPanel id="activity">
          <div className="p-6">
            <LightningCard>
              <LightningCardHeader
                title={`活動履歴 (${company.activities.length})`}
                action={
                  <Link
                    href={`/activities/new?companyId=${id}`}
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
              <ActivityTimeline activities={company.activities} />
            </LightningCard>
          </div>
        </TabPanel>
      </RecordTabs>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="顧客企業の削除"
        message={`「${company.companyName}」を削除しますか？関連するすべてのデータが削除されます。`}
        loading={deleting}
      />
    </div>
  );
}
