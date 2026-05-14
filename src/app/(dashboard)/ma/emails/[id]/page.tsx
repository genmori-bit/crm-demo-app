"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HighlightPanel } from "@/components/ui/highlight-panel";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "下書き", dot: "bg-sf-weak", text: "text-sf-weak" },
  scheduled: { label: "スケジュール済み", dot: "bg-warning", text: "text-warning" },
  sending: { label: "送信中", dot: "bg-primary-500 animate-pulse", text: "text-primary-600" },
  sent: { label: "送信済み", dot: "bg-success", text: "text-success" },
  paused: { label: "一時停止", dot: "bg-orange-400", text: "text-orange-600" },
};

export default function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [email, setEmail] = useState<MarketingEmail | null>(null);
  const [sending, setSending] = useState(false);

  const reload = () => fetch(`/api/ma/emails/${id}`).then((r) => r.json()).then(setEmail);

  useEffect(() => { reload(); }, [id]);

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
      reload();
    } else {
      showToast("送信に失敗しました", "error");
    }
    setSending(false);
  };

  if (!email) return <div className="p-6"><PageLoading /></div>;

  const cfg = STATUS_CONFIG[email.status] ?? { label: email.status, dot: "bg-sf-weak", text: "text-sf-weak" };
  const openRate = email.totalSent > 0 ? (email.totalOpened / email.totalSent) * 100 : null;
  const clickRate = email.totalSent > 0 ? (email.totalClicked / email.totalSent) * 100 : null;
  const bounceRate = email.totalSent > 0 ? (email.totalBounced / email.totalSent) * 100 : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sf bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-sf-weak font-medium mb-0.5">メール</p>
              <h1 className="text-lg font-bold text-sf-text leading-tight truncate">{email.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {email.status === "draft" && (
              <>
                <button
                  onClick={() => router.push(`/ma/emails/${id}/edit`)}
                  className="px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {sending ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  今すぐ送信
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Highlight panel */}
      <HighlightPanel
        fields={[
          {
            label: "ステータス",
            value: (
              <span className={cn("inline-flex items-center gap-1.5 font-medium", cfg.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
            ),
          },
          { label: "件名", value: email.subject },
          { label: "差出人", value: `${email.fromName} <${email.fromEmail}>` },
          { label: "送信リスト", value: email.list ? <Link href={`/ma/lists/${email.list.id}`} className="text-primary-600 hover:underline">{email.list.name}</Link> : "—" },
          { label: "テンプレート", value: email.template?.name ?? "—" },
          { label: "送信日時", value: email.sentAt ? new Date(email.sentAt).toLocaleString("ja-JP") : "—" },
        ]}
      />

      <div className="p-6 space-y-5">
        {/* Stats row (sent only) */}
        {email.status === "sent" && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="送信数"
              value={email.totalSent.toLocaleString()}
              accent="primary"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
            />
            <KpiCard
              label="開封数"
              value={email.totalOpened.toLocaleString()}
              sub={openRate !== null ? `開封率 ${openRate.toFixed(1)}%` : undefined}
              accent={openRate !== null && openRate >= 20 ? "success" : openRate !== null && openRate >= 10 ? "warning" : "danger"}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            />
            <KpiCard
              label="クリック数"
              value={email.totalClicked.toLocaleString()}
              sub={clickRate !== null ? `クリック率 ${clickRate.toFixed(1)}%` : undefined}
              accent={clickRate !== null && clickRate >= 5 ? "success" : "default"}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>}
            />
            <KpiCard
              label="バウンス数"
              value={email.totalBounced.toLocaleString()}
              sub={bounceRate !== null ? `バウンス率 ${bounceRate.toFixed(1)}%` : undefined}
              accent={email.totalBounced > 0 ? "danger" : "default"}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <KpiCard
              label="オプトアウト"
              value={email.totalOptOut.toLocaleString()}
              accent={email.totalOptOut > 0 ? "warning" : "default"}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            />
          </div>
        )}

        {/* Email funnel bar */}
        {email.status === "sent" && email.totalSent > 0 && (
          <LightningCard>
            <LightningCardHeader title="エンゲージメントファネル" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            } />
            <LightningCardBody>
              <div className="space-y-3">
                {[
                  { label: "送信", value: email.totalSent, color: "bg-primary-500" },
                  { label: "開封", value: email.totalOpened, color: "bg-success" },
                  { label: "クリック", value: email.totalClicked, color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-14 text-xs text-sf-weak text-right shrink-0">{item.label}</span>
                    <div className="flex-1 bg-sf-bg rounded-full h-4 overflow-hidden">
                      <div
                        className={cn("h-4 rounded-full transition-all", item.color)}
                        style={{ width: `${(item.value / email.totalSent) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      <span className="text-xs font-bold tabular-nums text-sf-text">{item.value.toLocaleString()}</span>
                      <span className="text-2xs text-sf-weak">({((item.value / email.totalSent) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </LightningCardBody>
          </LightningCard>
        )}

        {/* HTML body preview */}
        <LightningCard>
          <LightningCardHeader title="本文プレビュー" icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          } />
          <LightningCardBody>
            {email.bodyHtml ? (
              <div
                className="border border-sf-border rounded-sf p-5 bg-white text-sm max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <p className="text-sm text-sf-weak text-center py-6">本文が設定されていません</p>
            )}
          </LightningCardBody>
        </LightningCard>
      </div>
    </div>
  );
}
