"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Prospect {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
  phone: string | null;
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

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-800", A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700", C: "bg-yellow-100 text-yellow-700",
  D: "bg-gray-100 text-gray-600", F: "bg-red-100 text-red-700",
};

const ACTIVITY_ICONS: Record<string, string> = {
  email_send: "📧", email_open: "👁️", email_click: "🔗", form_submit: "📝",
  page_view: "🌐", score_change: "📈", status_change: "🔄",
};

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    fetch(`/api/ma/prospects/${id}`).then((r) => r.json()).then(setProspect);
  }, [id]);

  if (!prospect) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  const fullName = [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/prospects" className="text-xs text-sf-weak hover:underline">← プロスペクト一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{fullName}</h1>
          <p className="text-sm text-sf-weak">{prospect.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/ma/prospects/${id}/edit`)}>編集</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">基本情報</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                { label: "会社", value: prospect.company },
                { label: "役職", value: prospect.jobTitle },
                { label: "電話", value: prospect.phone },
                { label: "ソース", value: prospect.source },
                { label: "ステータス", value: prospect.status },
                { label: "作成日", value: new Date(prospect.createdAt).toLocaleDateString("ja-JP") },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-sf-weak text-xs">{item.label}</dt>
                  <dd className="text-sf-text">{item.value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Email History */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">メール履歴</h2>
            {prospect.emailRecipients.length === 0 ? (
              <p className="text-sm text-sf-weak">メール送信履歴なし</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sf-border">
                  <th className="text-left py-2 text-sf-weak">件名</th>
                  <th className="text-left py-2 text-sf-weak">ステータス</th>
                  <th className="text-left py-2 text-sf-weak">送信日</th>
                </tr></thead>
                <tbody className="divide-y divide-sf-border">
                  {prospect.emailRecipients.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2">{r.email.subject}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2">{r.email.sentAt ? new Date(r.email.sentAt).toLocaleDateString("ja-JP") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Form Submissions */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">フォーム送信履歴</h2>
            {prospect.formSubmissions.length === 0 ? (
              <p className="text-sm text-sf-weak">フォーム送信履歴なし</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {prospect.formSubmissions.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-sf-text">{s.form.name}</span>
                    <span className="text-sf-weak text-xs">{new Date(s.submittedAt).toLocaleDateString("ja-JP")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">活動タイムライン</h2>
            {prospect.activities.length === 0 ? (
              <p className="text-sm text-sf-weak">活動履歴なし</p>
            ) : (
              <ul className="space-y-2">
                {prospect.activities.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">{ACTIVITY_ICONS[a.type] ?? "•"}</span>
                    <div className="flex-1">
                      <span className="text-sf-text">{a.description}</span>
                      {a.score !== 0 && (
                        <span className={`ml-2 text-xs font-semibold ${a.score > 0 ? "text-green-600" : "text-red-600"}`}>
                          {a.score > 0 ? `+${a.score}` : a.score}
                        </span>
                      )}
                      <div className="text-xs text-sf-weak">{new Date(a.createdAt).toLocaleString("ja-JP")}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Score & Lists */}
        <div className="space-y-4">
          {/* Score Card */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4 text-center">
            <div className="text-4xl font-bold text-sf-text">{prospect.score}</div>
            <div className="text-xs text-sf-weak mt-1">スコア</div>
            <div className={`inline-block mt-3 px-3 py-1 rounded text-sm font-bold ${GRADE_COLORS[prospect.grade] ?? "bg-gray-100"}`}>
              グレード {prospect.grade}
            </div>
          </div>

          {/* Consent */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">同意・配信設定</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sf-weak">メール停止</span>
                <span className={prospect.doNotEmail ? "text-red-600 font-medium" : "text-green-600"}>
                  {prospect.doNotEmail ? "停止中" : "許可"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sf-weak">オプトアウト</span>
                <span className={prospect.optedOut ? "text-red-600 font-medium" : "text-green-600"}>
                  {prospect.optedOut ? "オプトアウト済み" : "オプトイン"}
                </span>
              </div>
            </div>
          </div>

          {/* Lists */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">所属リスト</h2>
            {prospect.listMemberships.length === 0 ? (
              <p className="text-sm text-sf-weak">リストなし</p>
            ) : (
              <ul className="space-y-1">
                {prospect.listMemberships.map((m) => (
                  <li key={m.list.id}>
                    <Link href={`/ma/lists/${m.list.id}`} className="text-sm text-primary-600 hover:underline">{m.list.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
