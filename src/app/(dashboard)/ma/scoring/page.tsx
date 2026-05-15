"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ScoringRule {
  id: string;
  name: string;
  category: string;
  triggerType: string;
  scoreChange: number;
  isActive: boolean;
  updatedAt: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  email_open: "メール開封",
  email_click: "メールクリック",
  form_submit: "フォーム送信",
  page_view: "ページ閲覧",
  email_send: "メール送信",
  page_view_pricing: "料金ページ閲覧",
  page_view_product: "製品ページ閲覧",
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

export default function ScoringPage() {
  const showToast = useToast();
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", category: "behavior", triggerType: "email_open", scoreChange: 10 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/scoring").then((r) => r.json()).then((data) => { setRules(data); setLoading(false); });
  };
  useEffect(load, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/ma/scoring/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  const saveNew = async () => {
    if (!newRule.name.trim()) { showToast("ルール名を入力してください", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/ma/scoring", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRule),
    });
    setSaving(false);
    if (res.ok) {
      showToast("スコアリングルールを追加しました", "success");
      setShowNew(false);
      setNewRule({ name: "", category: "behavior", triggerType: "email_open", scoreChange: 10 });
      load();
    }
  };

  const behaviorRules = rules.filter((r) => r.category === "behavior");
  const demographicRules = rules.filter((r) => r.category === "demographic");
  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sf-text">スコアリング</h1>
            <p className="text-xs text-sf-weak mt-0.5">
              {rules.length}件のルール中 <span className="text-success font-medium">{activeCount}件有効</span>
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ルール追加
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-sf px-4 py-3">
          <svg className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-primary-800">
            スコアは 0〜200 の範囲で管理されます。スコアが高いほど購買意欲が高いと判定されます。メール開封・クリック・フォーム送信などの行動が加点の対象です。
          </p>
        </div>

        {/* Add new rule form */}
        {showNew && (
          <LightningCard>
            <LightningCardHeader title="新規スコアリングルール" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
              </svg>
            } />
            <LightningCardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <input
                  placeholder="ルール名 *"
                  value={newRule.name}
                  onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                  className="col-span-full sm:col-span-2 h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                />
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule((p) => ({ ...p, category: e.target.value }))}
                  className="h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="behavior">行動スコア</option>
                  <option value="demographic">属性スコア</option>
                </select>
                <select
                  value={newRule.triggerType}
                  onChange={(e) => setNewRule((p) => ({ ...p, triggerType: e.target.value }))}
                  className="h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sf-weak shrink-0">スコア変化</span>
                  <input
                    type="number"
                    value={newRule.scoreChange}
                    onChange={(e) => setNewRule((p) => ({ ...p, scoreChange: Number(e.target.value) }))}
                    className="flex-1 h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-xs text-sf-text focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveNew}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  保存
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="px-3 py-1.5 text-xs font-medium text-sf-text border border-sf-border rounded-sf hover:bg-sf-bg transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </LightningCardBody>
          </LightningCard>
        )}

        {/* Rules by category */}
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : (
          <div className="space-y-5">
            {[
              { label: "行動スコアリング", rules: behaviorRules, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "属性スコアリング", rules: demographicRules, color: "text-purple-600", bg: "bg-purple-50" },
            ].map((section) => (
              <LightningCard key={section.label}>
                <LightningCardHeader title={section.label} icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                } />
                {section.rules.length === 0 ? (
                  <LightningCardBody>
                    <p className="text-xs text-sf-weak text-center py-3">ルールがありません</p>
                  </LightningCardBody>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-sf-border bg-sf-bg">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ルール名</th>
                          <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-36">トリガー</th>
                          <th className="text-center px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-24">スコア変化</th>
                          <th className="text-center px-4 py-2.5 text-2xs font-semibold text-sf-weak uppercase tracking-wider w-20">有効</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sf-border">
                        {section.rules.map((r) => (
                          <tr key={r.id} className="hover:bg-sf-bg transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium text-sf-text">{r.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-2xs text-sf-weak">{TRIGGER_LABELS[r.triggerType] ?? r.triggerType}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "text-xs font-bold tabular-nums px-2 py-0.5 rounded",
                                r.scoreChange > 0 ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                              )}>
                                {r.scoreChange > 0 ? `+${r.scoreChange}` : r.scoreChange}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Toggle on={r.isActive} onToggle={() => toggleActive(r.id, r.isActive)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </LightningCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
