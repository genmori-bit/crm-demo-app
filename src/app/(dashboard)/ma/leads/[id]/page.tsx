"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  title: string | null;
  industry: string | null;
  website: string | null;
  source: string | null;
  status: string;
  lifecycleStage: string | null;
  rating: string;
  score: number | null;
  grade: string | null;
  doNotEmail: boolean;
  optedOut: boolean;
  optedOutAt: string | null;
  emailBounced: boolean;
  spamComplaint: boolean;
  consentStatus: string;
  lastActivityAt: string | null;
  convertedAt: string | null;
  crmContactId: string | null;
  createdAt: string;
  engagementActivities: { id: string; type: string; description: string; score: number; createdAt: string }[];
  listMemberships: { list: { id: string; name: string } }[];
  emailRecipients: { email: { id: string; name: string; subject: string; sentAt: string | null }; status: string; openedAt: string | null; clickedAt: string | null }[];
  formSubmissions: { form: { id: string; name: string }; submittedAt: string }[];
  programEnrollments: { program: { id: string; name: string }; status: string; enrolledAt: string }[];
}

const GRADE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "A+": { bg: "bg-green-50",  text: "text-green-800", border: "border-green-200" },
  A:    { bg: "bg-green-50",  text: "text-green-700", border: "border-green-200" },
  B:    { bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200" },
  C:    { bg: "bg-yellow-50", text: "text-yellow-700",border: "border-yellow-200" },
  D:    { bg: "bg-gray-50",   text: "text-gray-500",  border: "border-gray-200" },
  F:    { bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200" },
};

const STAGE_INFO: Record<string, { label: string; variant: "brand" | "purple" | "warning" | "info" | "success" | "muted" }> = {
  VISITOR:     { label: "Visitor",     variant: "muted" },
  LEAD:        { label: "Lead",        variant: "brand" },
  MQL:         { label: "MQL",         variant: "purple" },
  SQL:         { label: "SQL",         variant: "warning" },
  OPPORTUNITY: { label: "Opportunity", variant: "info" },
  CUSTOMER:    { label: "Customer",    variant: "success" },
};

const TABS = [
  { id: "overview",  label: "概要" },
  { id: "emails",    label: "メール" },
  { id: "forms",     label: "フォーム" },
  { id: "programs",  label: "プログラム" },
  { id: "activity",  label: "活動" },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 border-b border-sf-border/60 last:border-0 items-start">
      <dt className="text-xs font-semibold text-sf-weak uppercase tracking-wide pt-px">{label}</dt>
      <dd className="text-sm text-sf-text">{children || <span className="text-sf-placeholder">—</span>}</dd>
    </div>
  );
}

function ScoreGauge({ score, grade }: { score: number | null; grade: string | null }) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const gradeStyle = grade ? GRADE_STYLE[grade] : null;
  const color = s >= 80 ? "#2e844a" : s >= 50 ? "#dd7a01" : s >= 30 ? "#0176d3" : "#c9c7c5";

  return (
    <div className="flex items-center gap-4">
      {/* Ring */}
      <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
        <svg width={72} height={72} className="-rotate-90">
          <circle cx={36} cy={36} r={28} fill="none" stroke="#f3f2f2" strokeWidth={8} />
          <circle
            cx={36} cy={36} r={28} fill="none"
            stroke={color} strokeWidth={8}
            strokeDasharray={`${(s / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold tabular-nums" style={{ color }}>{s}</span>
        </div>
      </div>
      {/* Grade badge */}
      {grade && gradeStyle && (
        <div className="text-center">
          <div className={cn("w-12 h-12 rounded-sf border-2 flex items-center justify-center font-black text-xl", gradeStyle.bg, gradeStyle.text, gradeStyle.border)}>
            {grade}
          </div>
          <p className="text-2xs text-sf-weak mt-1">グレード</p>
        </div>
      )}
      <div className="text-xs text-sf-weak leading-relaxed">
        スコアはエンゲージメント<br />活動によって加算されます
      </div>
    </div>
  );
}

export default function MALeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch(`/api/ma/leads/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setLead)
      .catch(() => showToast("リードを読み込めませんでした", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading />;
  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <EmptyState title="リードが見つかりません" description="削除済みまたはURLが無効です" action={<Button onClick={() => router.push("/ma/leads")}>リスト一覧へ</Button>} />
      </div>
    );
  }

  const combined = (lead.firstName?.[0] ?? "") + (lead.lastName?.[0] ?? "");
  const initials = (combined || lead.fullName[0] || "?").toUpperCase();
  const stageInfo = lead.lifecycleStage ? STAGE_INFO[lead.lifecycleStage] : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Record header ── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-primary-700">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold text-sf-weak uppercase tracking-wide">MAリード</p>
                {stageInfo && <Badge variant={stageInfo.variant} dot>{stageInfo.label}</Badge>}
                {lead.optedOut && <Badge variant="danger" dot>オプトアウト</Badge>}
              </div>
              <h1 className="text-xl font-bold text-sf-text leading-tight mt-0.5">{lead.fullName}</h1>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="text-xs text-sf-weak hover:text-primary-600 transition-colors">
                  {lead.email}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/leads/${lead.id}`)}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              CRMで開く
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/ma/leads/${id}/edit`)}>編集</Button>
          </div>
        </div>

        {/* Highlight strip */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3 pl-[60px]">
          {[
            { label: "会社名",        value: lead.companyName },
            { label: "役職",          value: lead.title },
            { label: "電話",          value: lead.phone },
            { label: "参照元",        value: lead.source },
            { label: "最終活動日",    value: lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleDateString("ja-JP") : null },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">{label}</p>
              <p className="text-sm text-sf-text mt-0.5 truncate">{value || <span className="text-sf-placeholder">—</span>}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-sf-surface border-b border-sf-border px-6 overflow-x-auto sticky top-14 z-20">
        <nav className="flex" style={{ scrollbarWidth: "none" }} role="tablist">
          {TABS.map((t) => {
            const count = t.id === "emails" ? lead.emailRecipients.length
              : t.id === "forms" ? lead.formSubmissions.length
              : t.id === "programs" ? lead.programEnrollments.length
              : t.id === "activity" ? lead.engagementActivities.length
              : undefined;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none",
                  tab === t.id ? "border-primary-500 text-primary-600" : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
                )}
              >
                {t.label}
                {count !== undefined && count > 0 && (
                  <span className={cn("text-2xs px-1.5 py-0.5 rounded-full font-bold tabular-nums", tab === t.id ? "bg-info-light text-primary-600" : "bg-sf-bg text-sf-weak")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 p-6">

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl animate-in">
            <div className="lg:col-span-2 space-y-4">

              {/* Score & Grade */}
              <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-5">
                <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider mb-4">スコア・グレード</h2>
                <ScoreGauge score={lead.score} grade={lead.grade} />
              </section>

              {/* Basic info */}
              <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-5">
                <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider mb-3">基本情報</h2>
                <dl>
                  <FieldRow label="氏名">{lead.fullName}</FieldRow>
                  <FieldRow label="メール">
                    {lead.email ? <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline">{lead.email}</a> : null}
                  </FieldRow>
                  <FieldRow label="電話">
                    {lead.phone ? <a href={`tel:${lead.phone}`} className="text-primary-600 hover:underline">{lead.phone}</a> : null}
                  </FieldRow>
                  <FieldRow label="会社名">{lead.companyName}</FieldRow>
                  <FieldRow label="役職">{lead.title}</FieldRow>
                  <FieldRow label="業種">{lead.industry}</FieldRow>
                  <FieldRow label="ウェブサイト">
                    {lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{lead.website}</a> : null}
                  </FieldRow>
                  <FieldRow label="参照元">{lead.source}</FieldRow>
                  <FieldRow label="登録日">{new Date(lead.createdAt).toLocaleDateString("ja-JP")}</FieldRow>
                </dl>
              </section>

              {/* Email consent */}
              <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-5">
                <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider mb-3">配信・同意状態</h2>
                <div className="space-y-2.5">
                  {[
                    { label: "メール配信",  ok: !lead.doNotEmail,    yes: "許可",       no: "停止中" },
                    { label: "オプトイン",  ok: !lead.optedOut,      yes: "オプトイン", no: "オプトアウト" },
                    { label: "バウンス",    ok: !lead.emailBounced,  yes: "正常",       no: "バウンス済み" },
                    { label: "スパム報告",  ok: !lead.spamComplaint, yes: "なし",       no: "報告あり" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-0.5">
                      <span className="text-sm text-sf-text">{item.label}</span>
                      <span className={cn("text-xs font-semibold flex items-center gap-1", item.ok ? "text-success" : "text-danger")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", item.ok ? "bg-success" : "bg-danger")} />
                        {item.ok ? item.yes : item.no}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* CRM link */}
              <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-4">
                <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider mb-3">CRM連携</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sf-weak">CRMリード</span>
                    <Link href={`/leads/${lead.id}`} className="text-xs text-primary-600 hover:underline font-medium">CRMで開く →</Link>
                  </div>
                  {lead.crmContactId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sf-weak">変換済み担当者</span>
                      <Link href={`/contacts/${lead.crmContactId}`} className="text-xs text-primary-600 hover:underline font-medium">担当者を開く →</Link>
                    </div>
                  )}
                  {lead.convertedAt && (
                    <div className="flex items-center justify-between pt-1 border-t border-sf-border mt-1">
                      <span className="text-xs text-sf-weak">変換日</span>
                      <span className="text-xs text-sf-text font-medium">{new Date(lead.convertedAt).toLocaleDateString("ja-JP")}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Lists */}
              <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider">所属リスト</h2>
                  {lead.listMemberships.length > 0 && (
                    <span className="text-2xs bg-sf-bg border border-sf-border rounded-full px-1.5 py-0.5 text-sf-weak font-bold tabular-nums">
                      {lead.listMemberships.length}
                    </span>
                  )}
                </div>
                {lead.listMemberships.length === 0 ? (
                  <p className="text-xs text-sf-weak text-center py-3">所属リストなし</p>
                ) : (
                  <ul className="space-y-1.5">
                    {lead.listMemberships.map((m) => (
                      <li key={m.list.id}>
                        <Link href={`/ma/lists/${m.list.id}`} className="text-xs text-primary-600 hover:underline">
                          {m.list.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Programs */}
              {lead.programEnrollments.length > 0 && (
                <section className="bg-sf-surface rounded-sf border border-sf-border shadow-card p-4">
                  <h2 className="text-xs font-bold text-sf-weak uppercase tracking-wider mb-3">参加中プログラム</h2>
                  <ul className="space-y-2">
                    {lead.programEnrollments.map((e) => (
                      <li key={e.program.id}>
                        <Link href={`/ma/engagement-programs/${e.program.id}`} className="text-xs text-primary-600 hover:underline block">
                          {e.program.name}
                        </Link>
                        <span className="text-2xs text-sf-weak">{e.status}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Emails tab */}
        {tab === "emails" && (
          <div className="max-w-3xl animate-in">
            <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-sf-border bg-sf-bg/50">
                <h2 className="text-sm font-semibold text-sf-text">メール送信履歴</h2>
              </div>
              {lead.emailRecipients.length === 0 ? (
                <EmptyState compact title="メール送信履歴がありません" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sf-border bg-sf-bg">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">件名</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">開封</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">クリック</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider">送信日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.emailRecipients.map((r, i) => (
                      <tr key={r.email.id} className={cn("border-b border-sf-border/60 last:border-0 hover:bg-sf-bg transition-colors", i % 2 === 1 && "bg-sf-bg/30")}>
                        <td className="px-5 py-3">
                          <Link href={`/ma/emails/${r.email.id}`} className="text-sm text-primary-600 hover:underline font-medium">{r.email.subject || r.email.name}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === "sent" ? "success" : r.status === "opened" ? "info" : "muted"}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.openedAt ? <span className="text-success font-bold">✓</span> : <span className="text-sf-placeholder">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.clickedAt ? <span className="text-success font-bold">✓</span> : <span className="text-sf-placeholder">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-sf-weak">
                          {r.email.sentAt ? new Date(r.email.sentAt).toLocaleDateString("ja-JP") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Forms tab */}
        {tab === "forms" && (
          <div className="max-w-3xl animate-in">
            <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-sf-border bg-sf-bg/50">
                <h2 className="text-sm font-semibold text-sf-text">フォーム送信履歴</h2>
              </div>
              {lead.formSubmissions.length === 0 ? (
                <EmptyState compact title="フォーム送信履歴がありません" />
              ) : (
                <ul>
                  {lead.formSubmissions.map((s) => (
                    <li key={s.form.id} className="border-b border-sf-border/60 last:border-0 px-5 py-3.5 flex items-center justify-between hover:bg-sf-bg transition-colors">
                      <Link href={`/ma/forms/${s.form.id}`} className="text-sm text-primary-600 hover:underline font-medium">{s.form.name}</Link>
                      <span className="text-xs text-sf-weak">{new Date(s.submittedAt).toLocaleString("ja-JP")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Programs tab */}
        {tab === "programs" && (
          <div className="max-w-3xl animate-in">
            <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-sf-border bg-sf-bg/50">
                <h2 className="text-sm font-semibold text-sf-text">Engagement Program 登録</h2>
              </div>
              {lead.programEnrollments.length === 0 ? (
                <EmptyState compact title="プログラム登録がありません" />
              ) : (
                <ul>
                  {lead.programEnrollments.map((e) => (
                    <li key={e.program.id} className="border-b border-sf-border/60 last:border-0 px-5 py-3.5 flex items-center justify-between hover:bg-sf-bg transition-colors">
                      <Link href={`/ma/engagement-programs/${e.program.id}`} className="text-sm text-primary-600 hover:underline font-medium">{e.program.name}</Link>
                      <div className="text-right">
                        <Badge variant="muted">{e.status}</Badge>
                        <p className="text-xs text-sf-weak mt-1">{new Date(e.enrolledAt).toLocaleDateString("ja-JP")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Activity tab */}
        {tab === "activity" && (
          <div className="max-w-3xl animate-in">
            <div className="bg-sf-surface rounded-sf border border-sf-border shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-sf-border bg-sf-bg/50">
                <h2 className="text-sm font-semibold text-sf-text">エンゲージメント活動</h2>
              </div>
              {lead.engagementActivities.length === 0 ? (
                <EmptyState compact title="活動履歴がありません" />
              ) : (
                <ul className="divide-y divide-sf-border/60">
                  {lead.engagementActivities.map((a) => (
                    <li key={a.id} className="px-5 py-4 flex items-start gap-3 hover:bg-sf-bg transition-colors">
                      <div className="w-7 h-7 rounded-full bg-info-light border border-info-border flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-sf-text leading-snug">{a.description}</p>
                        <p className="text-xs text-sf-weak mt-0.5">
                          <span className="font-medium">{a.type}</span>
                          {" · "}
                          {new Date(a.createdAt).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {a.score !== 0 && (
                        <span className={cn("text-xs font-bold tabular-nums px-1.5 py-0.5 rounded", a.score > 0 ? "text-success bg-success-light" : "text-danger bg-danger-light")}>
                          {a.score > 0 ? "+" : ""}{a.score}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
