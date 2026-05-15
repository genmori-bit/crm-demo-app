"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "下書き", dot: "bg-sf-weak", text: "text-sf-weak" },
  scheduled: { label: "スケジュール済み", dot: "bg-warning", text: "text-warning" },
  sending: { label: "送信中", dot: "bg-primary-500 animate-pulse", text: "text-primary-600" },
  sent: { label: "送信済み", dot: "bg-success", text: "text-success" },
  paused: { label: "一時停止", dot: "bg-orange-400", text: "text-orange-600" },
};

const STATUS_FILTERS = ["", "draft", "scheduled", "sent"] as const;

export default function EmailsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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

  const filtered = search
    ? emails.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase()))
    : emails;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">メール</h1>
            <p className="text-xs text-sf-weak mt-0.5">メールキャンペーンの作成・管理</p>
          </div>
          <button
            onClick={() => router.push("/ma/emails/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規メール
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mt-3">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                status === s
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-sf-border text-sf-weak hover:border-primary-300 hover:text-sf-text"
              )}
            >
              {s === "" ? "すべて" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <ListViewToolbar
        total={filtered.length}
        objectLabel="メール"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={load}
      />

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">メール名 / 件名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-32">リスト</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">ステータス</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">送信数</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">開封率</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">クリック率</th>
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border bg-sf-surface">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-sm text-sf-weak">
                  <div className="flex flex-col items-center gap-2">
                    <PageLoading />
                    読み込み中...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16">
                  <EmptyState
                    title="メールがありません"
                    description={search ? "検索条件に一致するメールが見つかりません" : "最初のメールキャンペーンを作成しましょう"}
                    action={!search ? { label: "新規メール", onClick: () => router.push("/ma/emails/new") } : undefined}
                  />
                </td>
              </tr>
            ) : filtered.map((e) => {
              const openRate = e.totalSent > 0 ? Math.round((e.totalOpened / e.totalSent) * 100) : null;
              const clickRate = e.totalSent > 0 ? Math.round((e.totalClicked / e.totalSent) * 100) : null;
              const cfg = STATUS_CONFIG[e.status] ?? { label: e.status, dot: "bg-sf-weak", text: "text-sf-weak" };
              return (
                <tr key={e.id} className="hover:bg-sf-bg transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/ma/emails/${e.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                      {e.name}
                    </Link>
                    <p className="text-2xs text-sf-weak truncate max-w-xs mt-0.5">{e.subject}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-sf-text">{e.list?.name ?? <span className="text-sf-placeholder">—</span>}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-2xs font-medium", cfg.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs tabular-nums text-sf-text">
                      {e.status === "sent" ? e.totalSent.toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-xs tabular-nums font-medium", openRate !== null && openRate >= 20 ? "text-success" : openRate !== null && openRate >= 10 ? "text-warning" : "text-sf-weak")}>
                      {openRate !== null ? `${openRate}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-xs tabular-nums font-medium", clickRate !== null && clickRate >= 5 ? "text-success" : "text-sf-weak")}>
                      {clickRate !== null ? `${clickRate}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.status === "draft" && (
                      <button
                        onClick={() => handleSend(e.id, e.name)}
                        className="text-2xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
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
