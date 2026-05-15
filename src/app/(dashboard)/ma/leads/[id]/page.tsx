"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

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

const GRADE_STYLE: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 border-green-200",
  A: "bg-green-100 text-green-700 border-green-200",
  B: "bg-blue-100 text-blue-700 border-blue-200",
  C: "bg-yellow-100 text-yellow-700 border-yellow-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
  F: "bg-red-100 text-red-700 border-red-200",
};

const STAGE_LABELS: Record<string, string> = {
  VISITOR: "ビジター", LEAD: "リード", MQL: "MQL", SQL: "SQL",
  OPPORTUNITY: "商談", CUSTOMER: "顧客",
};

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

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!lead) return <div className="p-6 text-sf-weak">リードが見つかりません</div>;

  const initials = (lead.firstName?.[0] ?? lead.fullName[0] ?? "?").toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-700">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-sf-weak font-medium mb-0.5">MAリード</p>
              <h1 className="text-lg font-bold text-sf-text leading-tight truncate">{lead.fullName}</h1>
              {lead.email && <p className="text-xs text-sf-weak">{lead.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/leads/${lead.id}`} className="px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg">
              CRMで開く
            </Link>
            <button onClick={() => router.push(`/ma/leads/${id}/edit`)} className="px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg">
              編集
            </button>
          </div>
        </div>
      </div>

      {/* Highlight bar */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-3 grid grid-cols-5 gap-4">
        {[
          { label: "メール", value: lead.email ? <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline text-xs">{lead.email}</a> : "—" },
          { label: "会社名", value: lead.companyName ?? "—" },
          { label: "ライフサイクル", value: lead.lifecycleStage ? STAGE_LABELS[lead.lifecycleStage] ?? lead.lifecycleStage : "—" },
          { label: "スコア / グレード", value: (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sf-text text-sm">{lead.score ?? 0}</span>
              {lead.grade && (
                <span className={`text-2xs px-1.5 py-0.5 rounded border font-bold ${GRADE_STYLE[lead.grade] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {lead.grade}
                </span>
              )}
            </div>
          )},
          { label: "配信状態", value: lead.optedOut ? <span className="text-xs text-red-600">オプトアウト</span> : lead.doNotEmail ? <span className="text-xs text-yellow-600">配信停止</span> : <span className="text-xs text-green-600">配信可</span> },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-2xs text-sf-weak mb-0.5">{item.label}</p>
            <div className="text-xs text-sf-text">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-sf-surface border-b border-sf-border px-6 flex gap-1">
        {[
          { id: "overview", label: "概要" },
          { id: "emails", label: `メール (${lead.emailRecipients.length})` },
          { id: "forms", label: `フォーム (${lead.formSubmissions.length})` },
          { id: "programs", label: `プログラム (${lead.programEnrollments.length})` },
          { id: "activity", label: `活動 (${lead.engagementActivities.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary-500 text-primary-600" : "border-transparent text-sf-weak hover:text-sf-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-4xl">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h2 className="text-xs font-semibold text-sf-text mb-3">基本情報</h2>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    ["氏名", lead.fullName],
                    ["メール", lead.email ?? "—"],
                    ["会社名", lead.companyName ?? "—"],
                    ["役職", lead.title ?? "—"],
                    ["電話", lead.phone ?? "—"],
                    ["業種", lead.industry ?? "—"],
                    ["参照元", lead.source ?? "—"],
                    ["ウェブサイト", lead.website ?? "—"],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt className="text-2xs text-sf-weak">{label}</dt>
                      <dd className="text-xs text-sf-text mt-0.5">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h2 className="text-xs font-semibold text-sf-text mb-3">スコア・グレード</h2>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl font-bold text-sf-text">{lead.score ?? 0}</span>
                  {lead.grade && (
                    <span className={`text-xl font-bold px-3 py-1 rounded-sf border ${GRADE_STYLE[lead.grade] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {lead.grade}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-sf-bg rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, lead.score ?? 0)}%` }} />
                </div>
                <p className="text-2xs text-sf-weak mt-1 text-right">{lead.score ?? 0} / 100</p>
              </div>

              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h2 className="text-xs font-semibold text-sf-text mb-3">配信設定</h2>
                <div className="space-y-2">
                  {[
                    { label: "メール配信", ok: !lead.doNotEmail, yes: "許可", no: "停止中" },
                    { label: "オプトイン", ok: !lead.optedOut, yes: "オプトイン", no: "オプトアウト" },
                    { label: "バウンス", ok: !lead.emailBounced, yes: "正常", no: "バウンス済み" },
                    { label: "スパム報告", ok: !lead.spamComplaint, yes: "なし", no: "報告あり" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-sf-weak">{item.label}</span>
                      <span className={`text-xs font-semibold ${item.ok ? "text-green-600" : "text-red-600"}`}>
                        {item.ok ? item.yes : item.no}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* CRM Link */}
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h2 className="text-xs font-semibold text-sf-text mb-3">CRM連携</h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-sf-weak">CRMリード</span>
                    <Link href={`/leads/${lead.id}`} className="text-xs text-primary-600 hover:underline">CRMで開く →</Link>
                  </div>
                  {lead.crmContactId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sf-weak">変換済み担当者</span>
                      <Link href={`/contacts/${lead.crmContactId}`} className="text-xs text-primary-600 hover:underline">担当者を開く →</Link>
                    </div>
                  )}
                  {lead.convertedAt && (
                    <div>
                      <span className="text-xs text-sf-weak">変換日: </span>
                      <span className="text-xs text-sf-text">{new Date(lead.convertedAt).toLocaleDateString("ja-JP")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lists */}
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h2 className="text-xs font-semibold text-sf-text mb-3">所属リスト ({lead.listMemberships.length})</h2>
                {lead.listMemberships.length === 0 ? (
                  <p className="text-xs text-sf-weak text-center py-2">所属リストなし</p>
                ) : (
                  <ul className="space-y-1">
                    {lead.listMemberships.map((m) => (
                      <li key={m.list.id}>
                        <Link href={`/ma/lists/${m.list.id}`} className="text-xs text-primary-600 hover:underline">{m.list.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "emails" && (
          <div className="max-w-3xl bg-sf-surface rounded-sf shadow-card border border-sf-border">
            <div className="px-4 py-3 border-b border-sf-border">
              <h2 className="text-xs font-semibold text-sf-text">メール送信履歴</h2>
            </div>
            {lead.emailRecipients.length === 0 ? (
              <div className="py-8 text-center text-xs text-sf-weak">メール送信履歴がありません</div>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sf-border bg-sf-bg">
                  <th className="text-left px-4 py-2 font-semibold text-sf-weak">件名</th>
                  <th className="text-left px-4 py-2 font-semibold text-sf-weak">ステータス</th>
                  <th className="text-left px-4 py-2 font-semibold text-sf-weak">開封</th>
                  <th className="text-left px-4 py-2 font-semibold text-sf-weak">クリック</th>
                  <th className="text-left px-4 py-2 font-semibold text-sf-weak">送信日</th>
                </tr></thead>
                <tbody className="divide-y divide-sf-border">
                  {lead.emailRecipients.map((r) => (
                    <tr key={r.email.id}>
                      <td className="px-4 py-2 text-sf-text">{r.email.subject}</td>
                      <td className="px-4 py-2 text-sf-weak">{r.status}</td>
                      <td className="px-4 py-2">{r.openedAt ? <span className="text-green-600">✓</span> : "—"}</td>
                      <td className="px-4 py-2">{r.clickedAt ? <span className="text-green-600">✓</span> : "—"}</td>
                      <td className="px-4 py-2 text-sf-weak">{r.email.sentAt ? new Date(r.email.sentAt).toLocaleDateString("ja-JP") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "forms" && (
          <div className="max-w-3xl bg-sf-surface rounded-sf shadow-card border border-sf-border">
            <div className="px-4 py-3 border-b border-sf-border">
              <h2 className="text-xs font-semibold text-sf-text">フォーム送信履歴</h2>
            </div>
            {lead.formSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-sf-weak">フォーム送信履歴がありません</div>
            ) : (
              <ul className="divide-y divide-sf-border">
                {lead.formSubmissions.map((s) => (
                  <li key={s.form.id} className="px-4 py-3 flex items-center justify-between">
                    <Link href={`/ma/forms/${s.form.id}`} className="text-xs text-primary-600 hover:underline">{s.form.name}</Link>
                    <span className="text-xs text-sf-weak">{new Date(s.submittedAt).toLocaleString("ja-JP")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "programs" && (
          <div className="max-w-3xl bg-sf-surface rounded-sf shadow-card border border-sf-border">
            <div className="px-4 py-3 border-b border-sf-border">
              <h2 className="text-xs font-semibold text-sf-text">Engagement Program 登録</h2>
            </div>
            {lead.programEnrollments.length === 0 ? (
              <div className="py-8 text-center text-xs text-sf-weak">プログラム登録がありません</div>
            ) : (
              <ul className="divide-y divide-sf-border">
                {lead.programEnrollments.map((e) => (
                  <li key={e.program.id} className="px-4 py-3 flex items-center justify-between">
                    <Link href={`/ma/engagement-programs/${e.program.id}`} className="text-xs text-primary-600 hover:underline">{e.program.name}</Link>
                    <div className="text-right">
                      <p className="text-xs text-sf-weak">{e.status}</p>
                      <p className="text-2xs text-sf-weak">{new Date(e.enrolledAt).toLocaleDateString("ja-JP")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div className="max-w-3xl bg-sf-surface rounded-sf shadow-card border border-sf-border">
            <div className="px-4 py-3 border-b border-sf-border">
              <h2 className="text-xs font-semibold text-sf-text">エンゲージメント活動</h2>
            </div>
            {lead.engagementActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-sf-weak">活動履歴がありません</div>
            ) : (
              <ul className="divide-y divide-sf-border">
                {lead.engagementActivities.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-sf-text">{a.description}</p>
                        <p className="text-2xs text-sf-weak mt-0.5">{a.type} · {new Date(a.createdAt).toLocaleString("ja-JP")}</p>
                      </div>
                      {a.score !== 0 && (
                        <span className={`text-2xs font-semibold ${a.score > 0 ? "text-green-600" : "text-red-600"}`}>
                          {a.score > 0 ? "+" : ""}{a.score}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
