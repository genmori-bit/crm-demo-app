"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageHeader } from "@/components/ui/page-header";
import { HighlightPanel } from "@/components/ui/highlight-panel";
import { RelatedList } from "@/components/ui/related-list";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { DealStageBadge } from "@/components/ui/status-badges";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatAmount } from "@/lib/utils";

interface Contact {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  isPrimary: boolean;
  memo: string | null;
  company: { id: string; companyName: string };
  deals: Array<{ id: string; dealName: string; stage: string; amount: number }>;
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
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Contact>(`/api/contacts/${id}`).then(setContact);
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/contacts/${id}`);
      showToast("担当者を削除しました");
      router.push("/contacts");
    } catch {
      showToast("削除に失敗しました", "error");
      setDeleting(false);
    }
  };

  if (!contact) return <PageLoading />;

  return (
    <div>
      <PageHeader
        objectIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        objectLabel="担当者"
        title={contact.fullName}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push(`/contacts/${id}/edit`)}>編集</Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>削除</Button>
          </>
        }
        meta={
          <HighlightPanel
            fields={[
              { label: "会社", value: (
                <Link href={`/companies/${contact.company.id}`} className="text-primary-500 hover:underline">
                  {contact.company.companyName}
                </Link>
              )},
              { label: "部署", value: contact.department },
              { label: "役職", value: contact.title },
              { label: "メール", value: contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-primary-500 hover:underline">{contact.email}</a>
              ) : null },
              { label: "電話", value: contact.phone },
              { label: "主要担当", value: contact.isPrimary ? "はい" : "いいえ" },
            ]}
          />
        }
      />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LightningCard>
            <LightningCardHeader title="基本情報" />
            <LightningCardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "部署", value: contact.department ?? "-" },
                  { label: "役職", value: contact.title ?? "-" },
                  { label: "主要担当", value: contact.isPrimary ? "はい" : "いいえ" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-sf-weak mb-0.5">{label}</dt>
                    <dd className="text-sm text-sf-text">{value}</dd>
                  </div>
                ))}
                {contact.email && (
                  <div>
                    <dt className="text-xs font-medium text-sf-weak mb-0.5">メール</dt>
                    <dd className="text-sm">
                      <a href={`mailto:${contact.email}`} className="text-primary-500 hover:underline">{contact.email}</a>
                    </dd>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <dt className="text-xs font-medium text-sf-weak mb-0.5">電話</dt>
                    <dd className="text-sm text-sf-text">{contact.phone}</dd>
                  </div>
                )}
              </dl>
              {contact.memo && (
                <div className="mt-4 pt-4 border-t border-sf-border">
                  <dt className="text-xs font-medium text-sf-weak mb-1">メモ</dt>
                  <dd className="text-sm text-sf-text whitespace-pre-wrap">{contact.memo}</dd>
                </div>
              )}
            </LightningCardBody>
          </LightningCard>

          <RelatedList
            title="関連商談"
            columns={[
              { key: "dealName", label: "商談名", render: (d) => (
                <Link href={`/deals/${d.id}`} className="font-medium text-primary-500 hover:underline">{d.dealName}</Link>
              )},
              { key: "stage", label: "ステージ", render: (d) => <DealStageBadge stage={d.stage} /> },
              { key: "amount", label: "金額", render: (d) => formatAmount(d.amount) },
            ]}
            items={contact.deals}
            getRowKey={(d) => d.id}
            newHref={`/deals/new?contactId=${id}`}
            emptyMessage="関連商談がありません"
          />
        </div>

        <LightningCard>
          <LightningCardHeader
            title={`活動履歴 (${contact.activities.length})`}
            action={
              <Link href={`/activities/new?contactId=${id}`} className="text-xs text-primary-500 hover:underline">追加</Link>
            }
          />
          <ActivityTimeline activities={contact.activities} />
        </LightningCard>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="担当者の削除"
        message={`「${contact.fullName}」を削除しますか？`}
        loading={deleting}
      />
    </div>
  );
}
