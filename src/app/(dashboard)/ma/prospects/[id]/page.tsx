"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HighlightPanel } from "@/components/ui/highlight-panel";
import { RecordTabs, TabPanel } from "@/components/ui/record-tabs";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { PageLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

interface Prospect {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  score: number;
  grade: string;
  status: string;
  doNotEmail: boolean;
  optedOut: boolean;
  optedOutAt: string | null;
  source: string | null;
  createdAt: string;
  activities: { id: string; type: string; description: string; score: number; createdAt: string }[];
  listMemberships: { list: { id: string; name: string } }[];
  emailRecipients: { email: { id: string; name: string; subject: string; sentAt: string | null }; status: string }[];
  formSubmissions: { form: { id: string; name: string }; submittedAt: string }[];
}

const GRADE_STYLE: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border-green-200",
  A: "bg-green-100 text-green-700 border-green-200",
  B: "bg-blue-100 text-blue-700 border-blue-200",
  C: "bg-yellow-100 text-yellow-700 border-yellow-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
  F: "bg-red-100 text-red-700 border-red-200",
};

const ACTIVITY_ICON_PATH: Record<string, string> = {
  email_send: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  email_open: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  email_click: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  form_submit: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  page_view: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
  score_change: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  status_change: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

const ACTIVITY_COLOR: Record<string, string> = {
  email_send: "bg-blue-50 text-blue-600",
  email_open: "bg-green-50 text-green-600",
  email_click: "bg-purple-50 text-purple-600",
  form_submit: "bg-orange-50 text-orange-600",
  page_view: "bg-teal-50 text-teal-600",
  score_change: "bg-yellow-50 text-yellow-600",
  status_change: "bg-gray-50 text-gray-600",
};

const EMAIL_STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  sent: { text: "送信済み", cls: "text-success" },
  opened: { text: "開封済み", cls: "text-primary-600" },
  clicked: { text: "クリック済み", cls: "text-purple-600" },
  bounced: { text: "バウンス", cls: "text-danger" },
  opted_out: { text: "オプトアウト", cls: "text-warning" },
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    fetch(`/api/ma/prospects/${id}`).then((r) => r.json()).then(setProspect);
  }, [id]);

  if (!prospect) {
    return (
      <div className="p-6">
        <PageLoading />
      </div>
    );
  }

  const fullName = [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.email;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-700">
                {(prospect.firstName?.[0] ?? prospect.email[0]).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-sf-weak font-medium mb-0.5">プロスペクト</p>
              <h1 className="text-lg font-bold text-sf-text leading-tight truncate">{fullName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/ma/prospects/${id}/edit`)}
              className="px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
            >
              編集
            </button>
          </div>
        </div>
      </div>

      {/* Highlight panel */}
      <HighlightPanel
        fields={[
          { label: "メール", value: <a href={`mailto:${prospect.email}`} className="text-primary-600 hover:underline">{prospect.email}</a> },
          { label: "会社", value: prospect.companyName ?? "—" },
          { label: "役職", value: prospect.jobTitle ?? "—" },
          {
            label: "ステータス",
            value: (
              <span className={cn(
                "inline-flex items-center gap-1 font-medium",
                prospect.optedOut ? "text-danger" : prospect.status === "active" ? "text-success" : prospect.status === "converted" ? "text-primary-600" : "text-sf-weak"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", prospect.optedOut ? "bg-danger" : prospect.status === "active" ? "bg-success" : prospect.status === "converted" ? "bg-primary-500" : "bg-sf-weak")} />
                {prospect.optedOut ? "オプトアウト" : prospect.status === "active" ? "アクティブ" : prospect.status === "converted" ? "コンバート済み" : prospect.status}
              </span>
            ),
          },
          {
            label: "スコア / グレード",
            value: (
              <div className="flex items-center gap-2">
                <span className="font-bold text-sf-text">{prospect.score}</span>
                <span className={cn("text-2xs px-1.5 py-0.5 rounded border font-bold", GRADE_STYLE[prospect.grade] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                  {prospect.grade}
                </span>
              </div>
            ),
          },
          { label: "登録日", value: new Date(prospect.createdAt).toLocaleDateString("ja-JP") },
        ]}
      />

      {/* Tabs */}
      <RecordTabs
        tabs={[
          { id: "overview", label: "概要" },
          { id: "emails", label: "メール履歴", count: prospect.emailRecipients.length },
          { id: "forms", label: "フォーム送信", count: prospect.formSubmissions.length },
          { id: "activity", label: "活動タイムライン", count: prospect.activities.length },
        ]}
      >
        {/* Overview tab */}
        <TabPanel id="overview">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* Basic info */}
              <LightningCard>
                <LightningCardHeader title="基本情報" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                } />
                <LightningCardBody>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: "メールアドレス", value: prospect.email },
                      { label: "電話番号", value: prospect.phone },
                      { label: "会社名", value: prospect.companyName },
                      { label: "役職", value: prospect.jobTitle },
                      { label: "業界", value: prospect.industry },
                      { label: "Webサイト", value: prospect.website ? <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{prospect.website}</a> : null },
                      { label: "国", value: prospect.country },
                      { label: "都道府県", value: prospect.state },
                      { label: "市区町村", value: prospect.city },
                      { label: "ソース", value: prospect.source },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">{item.label}</dt>
                        <dd className="text-xs text-sf-text">{item.value ?? <span className="text-sf-placeholder">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </LightningCardBody>
              </LightningCard>
            </div>

            <div className="space-y-5">
              {/* Score card */}
              <LightningCard>
                <LightningCardHeader title="スコアリング" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                } />
                <LightningCardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-4xl font-bold text-sf-text tabular-nums">{prospect.score}</p>
                      <p className="text-2xs text-sf-weak mt-0.5 uppercase tracking-wide">スコア</p>
                    </div>
                    <span className={cn("text-xl font-bold px-4 py-2 rounded-sf border", GRADE_STYLE[prospect.grade] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                      {prospect.grade}
                    </span>
                  </div>
                  {/* Score bar */}
                  <div className="h-2 bg-sf-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, prospect.score)}%` }}
                    />
                  </div>
                  <p className="text-2xs text-sf-weak mt-1 text-right">{prospect.score} / 100</p>
                </LightningCardBody>
              </LightningCard>

              {/* Consent */}
              <LightningCard>
                <LightningCardHeader title="配信設定" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                } />
                <LightningCardBody>
                  <div className="space-y-2.5">
                    {[
                      { label: "メール配信", ok: !prospect.doNotEmail, yes: "許可", no: "停止中" },
                      { label: "オプトイン状態", ok: !prospect.optedOut, yes: "オプトイン", no: "オプトアウト" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-sf-weak">{item.label}</span>
                        <span className={cn("text-xs font-semibold flex items-center gap-1", item.ok ? "text-success" : "text-danger")}>
                          {item.ok ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          )}
                          {item.ok ? item.yes : item.no}
                        </span>
                      </div>
                    ))}
                  </div>
                </LightningCardBody>
              </LightningCard>

              {/* Lists */}
              <LightningCard>
                <LightningCardHeader title="所属リスト" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                } />
                {prospect.listMemberships.length === 0 ? (
                  <LightningCardBody>
                    <p className="text-xs text-sf-weak text-center py-2">所属リストなし</p>
                  </LightningCardBody>
                ) : (
                  <ul className="divide-y divide-sf-border">
                    {prospect.listMemberships.map((m) => (
                      <li key={m.list.id} className="px-4 py-2.5">
                        <Link href={`/ma/lists/${m.list.id}`} className="text-xs text-primary-600 hover:underline">
                          {m.list.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </LightningCard>
            </div>
          </div>
        </TabPanel>

        {/* Email history tab */}
        <TabPanel id="emails">
          <div className="p-6">
            <LightningCard>
              <LightningCardHeader title="メール送信履歴" />
              {prospect.emailRecipients.length === 0 ? (
                <LightningCardBody>
                  <p className="text-sm text-sf-weak text-center py-6">メール送信履歴がありません</p>
                </LightningCardBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-sf-border bg-sf-bg">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">メール名 / 件名</th>
                        <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">ステータス</th>
                        <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-32">送信日</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sf-border">
                      {prospect.emailRecipients.map((r, i) => {
                        const sc = EMAIL_STATUS_LABELS[r.status] ?? { text: r.status, cls: "text-sf-weak" };
                        return (
                          <tr key={i} className="hover:bg-sf-bg transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/ma/emails/${r.email.id}`} className="text-xs font-medium text-primary-600 hover:underline block">
                                {r.email.name}
                              </Link>
                              <p className="text-2xs text-sf-weak mt-0.5">{r.email.subject}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-2xs font-medium", sc.cls)}>{sc.text}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-2xs text-sf-weak tabular-nums">
                                {r.email.sentAt ? new Date(r.email.sentAt).toLocaleDateString("ja-JP") : "—"}
                              </span>
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
        </TabPanel>

        {/* Form submissions tab */}
        <TabPanel id="forms">
          <div className="p-6">
            <LightningCard>
              <LightningCardHeader title="フォーム送信履歴" />
              {prospect.formSubmissions.length === 0 ? (
                <LightningCardBody>
                  <p className="text-sm text-sf-weak text-center py-6">フォーム送信履歴がありません</p>
                </LightningCardBody>
              ) : (
                <ul className="divide-y divide-sf-border">
                  {prospect.formSubmissions.map((s, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-3 hover:bg-sf-bg transition-colors">
                      <Link href={`/ma/forms/${s.form.id}`} className="text-xs font-medium text-primary-600 hover:underline">
                        {s.form.name}
                      </Link>
                      <span className="text-2xs text-sf-weak tabular-nums">
                        {new Date(s.submittedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </LightningCard>
          </div>
        </TabPanel>

        {/* Activity timeline tab */}
        <TabPanel id="activity">
          <div className="p-6">
            <LightningCard>
              <LightningCardHeader title="活動タイムライン" />
              {prospect.activities.length === 0 ? (
                <LightningCardBody>
                  <p className="text-sm text-sf-weak text-center py-6">活動履歴がありません</p>
                </LightningCardBody>
              ) : (
                <ul className="divide-y divide-sf-border">
                  {prospect.activities.map((a) => {
                    const iconPath = ACTIVITY_ICON_PATH[a.type] ?? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
                    const iconCls = ACTIVITY_COLOR[a.type] ?? "bg-gray-50 text-gray-600";
                    return (
                      <li key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-sf-bg transition-colors">
                        <div className={cn("w-7 h-7 rounded-sf flex items-center justify-center shrink-0 mt-0.5", iconCls)}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={iconPath} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-sf-text">{a.description}</p>
                          {a.score !== 0 && (
                            <span className={cn("text-2xs font-bold", a.score > 0 ? "text-success" : "text-danger")}>
                              {a.score > 0 ? `+${a.score}` : a.score} pts
                            </span>
                          )}
                          <p className="text-2xs text-sf-weak mt-0.5 tabular-nums">
                            {new Date(a.createdAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </LightningCard>
          </div>
        </TabPanel>
      </RecordTabs>
    </div>
  );
}
