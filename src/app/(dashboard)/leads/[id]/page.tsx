"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { ObjectIcon } from "@/components/ui/object-icon";

interface Lead {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  companyName: string | null;
  title: string | null;
  industry: string | null;
  website: string | null;
  source: string | null;
  status: string;
  rating: string;
  score: number | null;
  convertedAt: string | null;
  convertedAccountId: string | null;
  convertedContactId: string | null;
  convertedDealId: string | null;
  disqualifiedReason: string | null;
  createdAt: string;
  company: { id: string; companyName: string } | null;
  prospect: { id: string; email: string } | null;
  activities: { id: string; type: string; subject: string; activityDate: string }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "brand" | "warning" | "purple" | "success" | "muted" }> = {
  NEW:          { label: "新規",   variant: "brand" },
  WORKING:      { label: "対応中", variant: "warning" },
  NURTURING:    { label: "育成中", variant: "purple" },
  CONVERTED:    { label: "変換済", variant: "success" },
  DISQUALIFIED: { label: "失格",   variant: "muted" },
};

const RATING_MAP: Record<string, { label: string; variant: "danger" | "warning" | "info" }> = {
  HOT:  { label: "Hot",  variant: "danger" },
  WARM: { label: "Warm", variant: "warning" },
  COLD: { label: "Cold", variant: "info" },
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  CALL: "電話", EMAIL: "メール", MEETING: "ミーティング", NOTE: "メモ", TASK: "タスク",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-sf-border/60 last:border-0">
      <dt className="text-xs text-sf-weak w-28 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text flex-1 break-words">{children}</dd>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    createCompany: true, companyName: "", createDeal: false, dealName: "", dealAmount: "", dealStage: "qualification",
  });

  const load = () => {
    fetch(`/api/leads/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setLead(data); })
      .catch(() => { setLead(null); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (lead && !convertForm.companyName) {
      setConvertForm((f) => ({ ...f, companyName: lead.companyName ?? lead.fullName }));
    }
  }, [lead]);

  const convert = async () => {
    setConverting(true);
    const res = await fetch("/api/leads/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: id,
        createCompany: convertForm.createCompany,
        companyName: convertForm.companyName,
        createContact: true,
        createDeal: convertForm.createDeal,
        dealName: convertForm.dealName || undefined,
        dealAmount: convertForm.dealAmount ? parseFloat(convertForm.dealAmount) : undefined,
        dealStage: convertForm.dealStage,
      }),
    });
    setConverting(false);
    if (res.ok) {
      showToast("リードを変換しました", "success");
      setConvertOpen(false);
      load();
    } else {
      const err = await res.json();
      showToast(err.error ?? "変換に失敗しました", "error");
    }
  };

  if (loading) return <PageLoading />;
  if (!lead) return <div className="p-6 text-sf-weak">見つかりません</div>;

  const isConverted = !!lead.convertedAt;
  const statusInfo = STATUS_MAP[lead.status];
  const ratingInfo = RATING_MAP[lead.rating];

  const combined = (lead.firstName?.[0] ?? "") + (lead.lastName?.[0] ?? "");
  const initials = (combined || lead.fullName[0] || "?").toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-sf-weak mb-2" aria-label="パンくず">
          <Link href="/leads" className="hover:text-primary-600 hover:underline transition-colors">リード</Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text font-medium truncate">{lead.fullName}</span>
        </nav>

        <div className="flex items-start gap-4">
          <ObjectIcon objectType="Lead" size="sm" className="mt-0.5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-sf-text">{lead.fullName}</h1>
              {statusInfo && <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>}
              {ratingInfo && <Badge variant={ratingInfo.variant}>{ratingInfo.label}</Badge>}
              {isConverted && (
                <span className="text-xs text-success font-medium bg-success-light border border-success-border px-2 py-0.5 rounded">変換済み</span>
              )}
            </div>
            {(lead.title || lead.companyName) && (
              <p className="text-sm text-sf-weak mt-0.5">
                {[lead.title, lead.companyName].filter(Boolean).join(" · ")}
              </p>
            )}
            {lead.email && <p className="text-xs text-sf-weak mt-0.5">{lead.email}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isConverted && (
              <Button variant="success" onClick={() => setConvertOpen(true)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                変換
              </Button>
            )}
            <Button variant="neutral" onClick={() => router.push(`/leads/${id}/edit`)}>
              編集
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-5 items-start">
        <div className="col-span-2 space-y-5">
          {/* Converted banner */}
          {isConverted && (
            <LightningCard>
              <LightningCardBody className="bg-success-light border-l-4 border-l-success rounded-sf">
                <p className="text-sm font-semibold text-success mb-2">このリードは変換済みです</p>
                <div className="flex gap-4 flex-wrap text-sm">
                  {lead.convertedAccountId && (
                    <Link href={`/companies/${lead.convertedAccountId}`} className="text-primary-600 hover:underline font-medium">
                      会社レコードを見る →
                    </Link>
                  )}
                  {lead.convertedContactId && (
                    <Link href={`/contacts/${lead.convertedContactId}`} className="text-primary-600 hover:underline font-medium">
                      コンタクトを見る →
                    </Link>
                  )}
                  {lead.convertedDealId && (
                    <Link href={`/deals/${lead.convertedDealId}`} className="text-primary-600 hover:underline font-medium">
                      商談を見る →
                    </Link>
                  )}
                </div>
              </LightningCardBody>
            </LightningCard>
          )}

          {/* Basic info */}
          <LightningCard>
            <LightningCardHeader
              title="基本情報"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <LightningCardBody>
              <dl className="divide-y divide-sf-border/60">
                <FieldRow label="氏名">{lead.fullName}</FieldRow>
                <FieldRow label="メール">
                  {lead.email
                    ? <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline">{lead.email}</a>
                    : "—"}
                </FieldRow>
                <FieldRow label="電話">
                  {lead.phone
                    ? <a href={`tel:${lead.phone}`} className="text-primary-600 hover:underline">{lead.phone}</a>
                    : "—"}
                </FieldRow>
                <FieldRow label="携帯">
                  {lead.mobilePhone
                    ? <a href={`tel:${lead.mobilePhone}`} className="text-primary-600 hover:underline">{lead.mobilePhone}</a>
                    : "—"}
                </FieldRow>
                <FieldRow label="会社名">{lead.companyName ?? "—"}</FieldRow>
                <FieldRow label="役職">{lead.title ?? "—"}</FieldRow>
                <FieldRow label="業種">{lead.industry ?? "—"}</FieldRow>
                <FieldRow label="Webサイト">
                  {lead.website
                    ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{lead.website}</a>
                    : "—"}
                </FieldRow>
                <FieldRow label="ソース">{lead.source ?? "—"}</FieldRow>
              </dl>
            </LightningCardBody>
          </LightningCard>

          {/* Activities */}
          <LightningCard>
            <LightningCardHeader
              title="活動履歴"
              count={lead.activities.length}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            {lead.activities.length === 0 ? (
              <EmptyState compact title="活動履歴がありません" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" role="grid">
                  <thead>
                    <tr className="border-b border-sf-border bg-sf-bg/60">
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">日付</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">種別</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">件名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.activities.map((a) => (
                      <tr key={a.id} className="border-b border-sf-border/60 last:border-0 hover:bg-sf-bg/50">
                        <td className="px-4 py-2.5 text-sf-weak tabular-nums whitespace-nowrap">
                          {new Date(a.activityDate).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="muted">{ACTIVITY_TYPE_LABELS[a.type] ?? a.type}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-sf-text">{a.subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </LightningCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Qualification */}
          <LightningCard>
            <LightningCardHeader title="資格情報" />
            <LightningCardBody>
              <dl className="divide-y divide-sf-border/60">
                <FieldRow label="ステータス">
                  {statusInfo ? <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge> : "—"}
                </FieldRow>
                <FieldRow label="評価">
                  {ratingInfo ? <Badge variant={ratingInfo.variant}>{ratingInfo.label}</Badge> : "—"}
                </FieldRow>
                <FieldRow label="スコア">
                  {lead.score != null ? (
                    <span className="font-semibold tabular-nums">{lead.score}</span>
                  ) : "—"}
                </FieldRow>
                {lead.disqualifiedReason && (
                  <FieldRow label="失格理由">
                    <span className="text-danger">{lead.disqualifiedReason}</span>
                  </FieldRow>
                )}
              </dl>
            </LightningCardBody>
          </LightningCard>

          {/* Linked company */}
          {lead.company && (
            <LightningCard>
              <LightningCardHeader title="リンク企業" />
              <LightningCardBody>
                <Link href={`/companies/${lead.company.id}`} className="text-sm text-primary-600 hover:underline font-medium">
                  {lead.company.companyName}
                </Link>
              </LightningCardBody>
            </LightningCard>
          )}

          {/* MA Lead */}
          {lead.prospect && (
            <LightningCard>
              <LightningCardHeader title="MAリード" />
              <LightningCardBody>
                <Link href={`/ma/leads/${lead.prospect.id}`} className="text-sm text-primary-600 hover:underline">
                  {lead.prospect.email}
                </Link>
              </LightningCardBody>
            </LightningCard>
          )}

          {/* Meta */}
          <LightningCard>
            <LightningCardHeader title="レコード情報" />
            <LightningCardBody>
              <dl className="divide-y divide-sf-border/60">
                <FieldRow label="作成日">
                  {new Date(lead.createdAt).toLocaleDateString("ja-JP")}
                </FieldRow>
                {lead.convertedAt && (
                  <FieldRow label="変換日">
                    {new Date(lead.convertedAt).toLocaleDateString("ja-JP")}
                  </FieldRow>
                )}
              </dl>
            </LightningCardBody>
          </LightningCard>
        </div>
      </div>

      {/* Convert modal */}
      {convertOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConvertOpen(false)}>
          <div
            className="bg-white rounded-sf shadow-dropdown w-full max-w-md animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-sf-border">
              <h2 className="text-base font-bold text-sf-text">リードを変換</h2>
              <button
                onClick={() => setConvertOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-sf text-sf-weak hover:bg-sf-bg hover:text-sf-text transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-sf-weak">変換すると、コンタクト・会社・商談レコードが作成されます。</p>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-primary-500"
                  checked={convertForm.createCompany}
                  onChange={(e) => setConvertForm((f) => ({ ...f, createCompany: e.target.checked }))}
                />
                <span className="text-sm text-sf-text font-medium">新規会社を作成</span>
              </label>

              {convertForm.createCompany && (
                <div className="pl-6">
                  <label className="block">
                    <span className="text-xs font-medium text-sf-weak block mb-1">会社名</span>
                    <input
                      className="w-full h-8 px-3 text-sm rounded-sf border border-sf-border focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
                      value={convertForm.companyName}
                      onChange={(e) => setConvertForm((f) => ({ ...f, companyName: e.target.value }))}
                    />
                  </label>
                </div>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-primary-500"
                  checked={convertForm.createDeal}
                  onChange={(e) => setConvertForm((f) => ({ ...f, createDeal: e.target.checked }))}
                />
                <span className="text-sm text-sf-text font-medium">商談を作成</span>
              </label>

              {convertForm.createDeal && (
                <div className="pl-6 space-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-sf-weak block mb-1">商談名</span>
                    <input
                      className="w-full h-8 px-3 text-sm rounded-sf border border-sf-border focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
                      value={convertForm.dealName}
                      onChange={(e) => setConvertForm((f) => ({ ...f, dealName: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-sf-weak block mb-1">金額</span>
                    <input
                      type="number"
                      className="w-full h-8 px-3 text-sm rounded-sf border border-sf-border focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
                      value={convertForm.dealAmount}
                      onChange={(e) => setConvertForm((f) => ({ ...f, dealAmount: e.target.value }))}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-sf-border bg-sf-bg rounded-b-sf">
              <Button variant="success" onClick={convert} disabled={converting} className="flex-1">
                {converting ? "変換中..." : "変換する"}
              </Button>
              <Button variant="neutral" onClick={() => setConvertOpen(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
