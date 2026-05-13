"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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

export default function AutomationRulesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">オートメーションルール</h1>
          <p className="text-sm text-sf-weak">{rules.length} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/automation-rules/new")}>新規ルール</Button>
      </div>

      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ルール名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">トリガー</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">状態</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">実行回数</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">最終実行</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">オートメーションルールがありません</td></tr>
            ) : rules.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/ma/automation-rules/${r.id}`} className="font-medium text-primary-600 hover:underline block">{r.name}</Link>
                  {r.description && <div className="text-xs text-sf-weak">{r.description}</div>}
                </td>
                <td className="px-4 py-3 text-sf-weak">{TRIGGER_LABELS[r.triggerType] ?? r.triggerType}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(r.id, r.isActive)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${r.isActive ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${r.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-sf-text">{r.runCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sf-weak text-xs">{r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString("ja-JP") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/ma/automation-rules/${r.id}`} className="text-xs text-primary-600 hover:underline">詳細</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
