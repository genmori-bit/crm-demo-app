"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface MarketingEmail {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalOptOut: number;
  scheduledAt: string | null;
  sentAt: string | null;
  updatedAt: string;
  template: { id: string; name: string } | null;
  list: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  scheduled: { label: "スケジュール済み", cls: "bg-yellow-100 text-yellow-700" },
  sending: { label: "送信中", cls: "bg-blue-100 text-blue-700" },
  sent: { label: "送信済み", cls: "bg-green-100 text-green-700" },
  paused: { label: "一時停止", cls: "bg-orange-100 text-orange-700" },
};

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState<MarketingEmail | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/ma/emails/${id}`).then((r) => r.json()).then(setEmail);
  }, [id]);

  const handleSend = async () => {
    if (!email) return;
    if (!email.list) { showToast("送信リストを設定してください", "error"); return; }
    if (!confirm(`「${email.name}」を今すぐ送信しますか？`)) return;
    setSending(true);
    const res = await fetch(`/api/ma/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(`${data.sent} 件に送信しました`, "success");
      fetch(`/api/ma/emails/${id}`).then((r) => r.json()).then(setEmail);
    } else {
      showToast("送信に失敗しました", "error");
    }
    setSending(false);
  };

  if (!email) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  const st = STATUS_LABELS[email.status] ?? { label: email.status, cls: "bg-gray-100 text-gray-600" };
  const openRate = email.totalSent > 0 ? ((email.totalOpened / email.totalSent) * 100).toFixed(1) : null;
  const clickRate = email.totalSent > 0 ? ((email.totalClicked / email.totalSent) * 100).toFixed(1) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/emails" className="text-xs text-sf-weak hover:underline">← メール一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{email.name}</h1>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
        </div>
        <div className="flex gap-2">
          {email.status === "draft" && (
            <>
              <Button variant="secondary" onClick={() => router.push(`/ma/emails/${id}/edit`)}>編集</Button>
              <Button onClick={handleSend} loading={sending}>今すぐ送信</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Email Info */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">メール情報</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-sf-weak text-xs">件名</dt><dd className="text-sf-text">{email.subject}</dd></div>
              <div><dt className="text-sf-weak text-xs">差出人</dt><dd className="text-sf-text">{email.fromName} &lt;{email.fromEmail}&gt;</dd></div>
              <div><dt className="text-sf-weak text-xs">送信リスト</dt><dd>{email.list ? <Link href={`/ma/lists/${email.list.id}`} className="text-primary-600 hover:underline">{email.list.name}</Link> : "—"}</dd></div>
              <div><dt className="text-sf-weak text-xs">テンプレート</dt><dd className="text-sf-text">{email.template?.name ?? "—"}</dd></div>
              {email.sentAt && <div><dt className="text-sf-weak text-xs">送信日時</dt><dd className="text-sf-text">{new Date(email.sentAt).toLocaleString("ja-JP")}</dd></div>}
            </dl>
          </div>

          {/* HTML Preview */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">本文プレビュー</h2>
            <div
              className="prose prose-sm max-w-none border border-sf-border rounded p-4 bg-white text-sm"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {email.status === "sent" ? (
            <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
              <h2 className="text-sm font-semibold text-sf-text mb-3">送信結果</h2>
              <div className="space-y-3">
                {[
                  { label: "送信数", value: email.totalSent.toLocaleString() },
                  { label: "開封数", value: email.totalOpened.toLocaleString(), sub: openRate ? `${openRate}%` : null },
                  { label: "クリック数", value: email.totalClicked.toLocaleString(), sub: clickRate ? `${clickRate}%` : null },
                  { label: "バウンス数", value: email.totalBounced.toLocaleString() },
                  { label: "オプトアウト", value: email.totalOptOut.toLocaleString() },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-sf-weak">{item.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-sf-text">{item.value}</span>
                      {item.sub && <span className="ml-1 text-xs text-sf-weak">({item.sub})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
              <p className="text-sm text-sf-weak text-center">送信後に統計が表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
