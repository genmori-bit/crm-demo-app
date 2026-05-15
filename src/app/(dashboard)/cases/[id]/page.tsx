"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";

interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  origin: string | null;
  type: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  company: { id: string; companyName: string } | null;
  contact: { id: string; fullName: string; email: string | null } | null;
  tasks: { id: string; title: string; status: string; dueDate: string | null }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "brand" | "warning" | "purple" | "danger" | "muted" }> = {
  New:                { label: "新規",       variant: "brand" },
  Open:               { label: "対応中",     variant: "warning" },
  "Pending Customer": { label: "顧客待ち",   variant: "purple" },
  "Pending Internal": { label: "社内待ち",   variant: "muted" },
  Escalated:          { label: "エスカレート", variant: "danger" },
  Closed:             { label: "クローズ",   variant: "muted" },
};

const PRIORITY_MAP: Record<string, { label: string; variant: "danger" | "warning" | "info" | "muted" }> = {
  Critical: { label: "重大", variant: "danger" },
  High:     { label: "高",   variant: "warning" },
  Medium:   { label: "中",   variant: "info" },
  Low:      { label: "低",   variant: "muted" },
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-sf-border/60 last:border-0">
      <dt className="text-xs text-sf-weak w-28 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text flex-1 break-words">{children}</dd>
    </div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [caseRecord, setCaseRecord] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState("");

  const load = () => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then((data) => { setCaseRecord(data); setEditStatus(data.status); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { showToast("ステータスを更新しました", "success"); load(); }
    else showToast("更新に失敗しました", "error");
  };

  if (loading) return <PageLoading />;
  if (!caseRecord) return <div className="p-6 text-sf-weak">見つかりません</div>;

  const statusInfo = STATUS_MAP[caseRecord.status];
  const priorityInfo = PRIORITY_MAP[caseRecord.priority];
  const isClosed = caseRecord.status === "Closed";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-sf-weak mb-2" aria-label="パンくず">
          <Link href="/cases" className="hover:text-primary-600 hover:underline transition-colors">ケース</Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text font-medium truncate">#{caseRecord.caseNumber}</span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs text-sf-weak font-mono">#{caseRecord.caseNumber}</span>
              {statusInfo && <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>}
              {priorityInfo && <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>}
            </div>
            <h1 className="text-xl font-bold text-sf-text">{caseRecord.subject}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={editStatus}
              onChange={(e) => { setEditStatus(e.target.value); updateStatus(e.target.value); }}
              className="h-8 text-xs w-36"
              aria-label="ステータスを変更"
            >
              <option value="New">新規</option>
              <option value="Open">対応中</option>
              <option value="Pending Customer">顧客待ち</option>
              <option value="Pending Internal">社内待ち</option>
              <option value="Escalated">エスカレート</option>
              <option value="Closed">クローズ</option>
            </Select>
            <Button variant="neutral" onClick={() => router.push(`/cases/${id}/edit`)}>
              編集
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-5 items-start">
        <div className="col-span-2 space-y-5">
          {/* Resolution banner */}
          {isClosed && caseRecord.resolution && (
            <LightningCard>
              <LightningCardBody className="bg-success-light border-l-4 border-l-success rounded-sf">
                <p className="text-xs font-semibold text-success mb-1.5">解決内容</p>
                <p className="text-sm text-sf-text whitespace-pre-wrap">{caseRecord.resolution}</p>
              </LightningCardBody>
            </LightningCard>
          )}

          {/* Details */}
          <LightningCard>
            <LightningCardHeader
              title="ケース詳細"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <LightningCardBody>
              <dl className="divide-y divide-sf-border/60">
                <FieldRow label="ステータス">
                  {statusInfo ? <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge> : caseRecord.status}
                </FieldRow>
                <FieldRow label="優先度">
                  {priorityInfo ? <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge> : caseRecord.priority}
                </FieldRow>
                <FieldRow label="タイプ">{caseRecord.type ?? "—"}</FieldRow>
                <FieldRow label="問い合わせ経路">{caseRecord.origin ?? "—"}</FieldRow>
                <FieldRow label="作成日">{new Date(caseRecord.createdAt).toLocaleDateString("ja-JP")}</FieldRow>
                {caseRecord.resolvedAt && (
                  <FieldRow label="解決日">{new Date(caseRecord.resolvedAt).toLocaleDateString("ja-JP")}</FieldRow>
                )}
                {caseRecord.description && (
                  <FieldRow label="説明">
                    <span className="whitespace-pre-wrap">{caseRecord.description}</span>
                  </FieldRow>
                )}
              </dl>
            </LightningCardBody>
          </LightningCard>

          {/* Tasks */}
          <LightningCard>
            <LightningCardHeader
              title="タスク"
              count={caseRecord.tasks.length}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              action={
                <Button size="xs" variant="neutral" onClick={() => router.push(`/tasks/new?caseId=${id}`)}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  追加
                </Button>
              }
            />
            {caseRecord.tasks.length === 0 ? (
              <EmptyState compact title="タスクがありません" />
            ) : (
              <div className="divide-y divide-sf-border/60">
                {caseRecord.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${t.status === "done" ? "border-success bg-success" : "border-sf-border"}`}>
                      {t.status === "done" && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm flex-1 ${t.status === "done" ? "line-through text-sf-weak" : "text-sf-text"}`}>
                      {t.title}
                    </span>
                    {t.dueDate && (
                      <span className="text-xs text-sf-weak tabular-nums">
                        {new Date(t.dueDate).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </LightningCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {caseRecord.company && (
            <LightningCard>
              <LightningCardHeader title="顧客企業" />
              <LightningCardBody>
                <Link href={`/companies/${caseRecord.company.id}`} className="text-sm text-primary-600 hover:underline font-medium">
                  {caseRecord.company.companyName}
                </Link>
              </LightningCardBody>
            </LightningCard>
          )}

          {caseRecord.contact && (
            <LightningCard>
              <LightningCardHeader title="コンタクト" />
              <LightningCardBody>
                <Link href={`/contacts/${caseRecord.contact.id}`} className="text-sm text-primary-600 hover:underline font-medium block">
                  {caseRecord.contact.fullName}
                </Link>
                {caseRecord.contact.email && (
                  <p className="text-xs text-sf-weak mt-0.5">{caseRecord.contact.email}</p>
                )}
              </LightningCardBody>
            </LightningCard>
          )}
        </div>
      </div>
    </div>
  );
}
