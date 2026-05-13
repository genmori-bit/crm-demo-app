"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Email {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  scheduledAt: string | null;
  sentAt: string | null;
  updatedAt: string;
  list: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "text-sf-weak" },
  scheduled: { label: "スケジュール済み", cls: "text-yellow-600" },
  sending: { label: "送信中", cls: "text-blue-600" },
  sent: { label: "送信済み", cls: "text-green-600" },
  paused: { label: "一時停止", cls: "text-orange-600" },
};

export default function EmailsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const showToast = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const data = await fetch(`/api/ma/emails?${params}`).then((r) => r.json());
    setEmails(data.emails ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (id: string, name: string) => {
    if (!confirm(`「${name}」を今すぐ送信しますか？`)) return;
    const res = await fetch(`/api/ma/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    });
    if (res.ok) {
      const data = await res.json();
      showToast(`${data.sent} 件送信しました`, "success");
      load();
    } else {
      showToast("送信に失敗しました", "error");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">メール</h1>
          <p className="text-sm text-sf-weak">{total} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/emails/new")}>新規メール</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "draft", "scheduled", "sent"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${status === s ? "bg-primary-500 text-white border-primary-500" : "border-sf-border text-sf-weak hover:border-primary-500"}`}
          >
            {s === "" ? "すべて" : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">メール名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">リスト</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ステータス</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">送信数</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">開封率</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">クリック率</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : emails.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-sf-weak">メールがありません</td></tr>
            ) : emails.map((e) => {
              const openRate = e.totalSent > 0 ? Math.round((e.totalOpened / e.totalSent) * 100) : null;
              const clickRate = e.totalSent > 0 ? Math.round((e.totalClicked / e.totalSent) * 100) : null;
              const st = STATUS_LABELS[e.status] ?? { label: e.status, cls: "text-sf-weak" };
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/ma/emails/${e.id}`} className="font-medium text-primary-600 hover:underline block">{e.name}</Link>
                    <div className="text-xs text-sf-weak truncate max-w-xs">{e.subject}</div>
                  </td>
                  <td className="px-4 py-3 text-sf-weak text-xs">{e.list?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sf-text">{e.status === "sent" ? e.totalSent.toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right text-sf-text">{openRate !== null ? `${openRate}%` : "—"}</td>
                  <td className="px-4 py-3 text-right text-sf-text">{clickRate !== null ? `${clickRate}%` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {e.status === "draft" && (
                      <button
                        onClick={() => handleSend(e.id, e.name)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        送信
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
