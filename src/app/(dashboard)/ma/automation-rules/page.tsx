"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  updatedAt: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  prospect_created: "プロスペクト作成時",
  form_submit: "フォーム送信時",
  email_open: "メール開封時",
  email_click: "メールクリック時",
  score_change: "スコア変更時",
  field_change: "フィールド変更時",
  date_based: "日付指定",
};

const TRIGGER_COLOR: Record<string, string> = {
  prospect_created: "bg-blue-50 text-blue-700",
  form_submit: "bg-orange-50 text-orange-700",
  email_open: "bg-green-50 text-green-700",
  email_click: "bg-purple-50 text-purple-700",
  score_change: "bg-yellow-50 text-yellow-700",
  field_change: "bg-teal-50 text-teal-700",
  date_based: "bg-gray-50 text-gray-700",
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={on ? "無効にする" : "有効にする"}
      className={cn(
        "relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
        on ? "bg-success" : "bg-sf-border"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5",
        on ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  );
}

export default function AutomationRulesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/automation-rules").then((r) => r.json()).then((data) => { setRules(data); setLoading(false); });
  };
  useEffect(load, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/ma/automation-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    showToast(`${!current ? "有効" : "無効"}にしました`, "success");
    load();
  };

  const filtered = search ? rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())) : rules;
  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">オートメーションルール</h1>
            <p className="text-xs text-sf-weak mt-0.5">
              {rules.length}件中 <span className="text-success font-medium">{activeCount}件有効</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/ma/automation-rules/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規ルール
          </button>
        </div>
      </div>

      <ListViewToolbar
        total={filtered.length}
        objectLabel="ルール"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={load}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-sf-bg border-b border-sf-border z-10">
            <tr>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ルール名</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-36">トリガー</th>
              <th className="text-right px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-24">実行回数</th>
              <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-28">最終実行</th>
              <th className="text-center px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">有効</th>
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border bg-sf-surface">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-sf-weak">
                  <div className="flex flex-col items-center gap-2">
                    <PageLoading />
                    読み込み中...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState
                    title="オートメーションルールがありません"
                    description={search ? "検索条件に一致するルールがありません" : "条件に応じたアクションを自動化するルールを作成しましょう"}
                    action={!search ? { label: "新規ルール", onClick: () => router.push("/ma/automation-rules/new") } : undefined}
                  />
                </td>
              </tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="hover:bg-sf-bg transition-colors group">
                <td className="px-4 py-3">
                  <Link href={`/ma/automation-rules/${r.id}`} className="font-medium text-primary-600 hover:underline text-xs block">
                    {r.name}
                  </Link>
                  {r.description && (
                    <p className="text-2xs text-sf-weak mt-0.5 truncate max-w-sm">{r.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium", TRIGGER_COLOR[r.triggerType] ?? "bg-gray-50 text-gray-700")}>
                    {TRIGGER_LABELS[r.triggerType] ?? r.triggerType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-bold tabular-nums text-sf-text">{r.runCount.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xs text-sf-weak tabular-nums">
                    {r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString("ja-JP") : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Toggle on={r.isActive} onToggle={() => toggleActive(r.id, r.isActive)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/ma/automation-rules/${r.id}`} className="text-2xs text-primary-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
