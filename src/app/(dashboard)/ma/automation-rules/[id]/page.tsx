"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface AutomationRule {
  id: string; name: string; description: string | null;
  triggerType: string; isActive: boolean; runCount: number;
  lastRunAt: string | null; updatedAt: string;
  conditions: unknown[]; actions: unknown[];
}

const TRIGGER_LABELS: Record<string, string> = {
  prospect_created: "プロスペクト作成時", form_submit: "フォーム送信時",
  email_open: "メール開封時", email_click: "メールクリック時",
  score_change: "スコア変更時", field_change: "フィールド変更時", date_based: "日付指定",
};

export default function AutomationRuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [rule, setRule] = useState<AutomationRule | null>(null);

  const load = () => fetch(`/api/ma/automation-rules/${id}`).then((r) => r.json()).then(setRule);
  useEffect(() => { load(); }, [id]);

  const toggleActive = async () => {
    if (!rule) return;
    await fetch(`/api/ma/automation-rules/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    showToast(`${!rule.isActive ? "有効" : "無効"}にしました`, "success");
    load();
  };

  if (!rule) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/automation-rules" className="text-xs text-sf-weak hover:underline">← オートメーションルール一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{rule.name}</h1>
          {rule.description && <p className="text-sm text-sf-weak">{rule.description}</p>}
        </div>
        <Button variant="secondary" onClick={toggleActive}>{rule.isActive ? "無効にする" : "有効にする"}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">トリガー</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-sm text-sf-text font-medium">{TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}</span>
            </div>
          </div>

          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">アクション ({(rule.actions as unknown[]).length} 件)</h2>
            <ol className="space-y-2">
              {(rule.actions as Record<string, unknown>[]).map((a, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sf-text">{String(a.type ?? "")}</span>
                </li>
              ))}
              {(rule.actions as unknown[]).length === 0 && <li className="text-sm text-sf-weak">アクションなし</li>}
            </ol>
          </div>
        </div>

        <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
          <h2 className="text-sm font-semibold text-sf-text mb-3">統計</h2>
          <div className="space-y-3">
            <div className="text-center border-b border-sf-border pb-3">
              <div className="text-3xl font-bold text-sf-text">{rule.runCount.toLocaleString()}</div>
              <div className="text-xs text-sf-weak">実行回数</div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sf-weak">状態</span>
              <span className={`font-medium ${rule.isActive ? "text-green-600" : "text-gray-400"}`}>
                {rule.isActive ? "有効" : "無効"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sf-weak">最終実行</span>
              <span className="text-sf-weak text-xs">{rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleDateString("ja-JP") : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
