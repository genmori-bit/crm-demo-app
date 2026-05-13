"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  email_open: "メール開封", email_click: "メールクリック",
  form_submit: "フォーム送信", page_view: "ページ閲覧",
  email_send: "メール送信", page_view_pricing: "料金ページ閲覧",
  page_view_product: "製品ページ閲覧",
};

export default function ScoringPage() {
  const showToast = useToast();
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", category: "behavior", triggerType: "email_open", scoreChange: 10 });

  const load = () => {
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
    const res = await fetch("/api/ma/scoring", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRule),
    });
    if (res.ok) { showToast("スコアリングルールを追加しました", "success"); setShowNew(false); load(); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">スコアリング</h1>
          <p className="text-sm text-sf-weak">プロスペクトの行動に応じてスコアを自動加減点します</p>
        </div>
        <Button onClick={() => setShowNew(true)}>ルール追加</Button>
      </div>

      {/* Scoring explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-sf p-4 text-sm text-blue-800">
        スコアは 0〜200 の範囲で管理されます。スコアが高いほど購買意欲が高いと判定されます。
        メール開封・クリック・フォーム送信などの行動が加点の対象です。
      </div>

      {/* New Rule Form */}
      {showNew && (
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sf-text">新規スコアリングルール</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              placeholder="ルール名"
              value={newRule.name}
              onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
              className="h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-sm col-span-2"
            />
            <select value={newRule.category} onChange={(e) => setNewRule((p) => ({ ...p, category: e.target.value }))}
              className="h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm">
              <option value="behavior">行動スコア</option>
              <option value="demographic">属性スコア</option>
            </select>
            <select value={newRule.triggerType} onChange={(e) => setNewRule((p) => ({ ...p, triggerType: e.target.value }))}
              className="h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm">
              {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="number" placeholder="スコア変化 (例: +10 または -5)"
              value={newRule.scoreChange}
              onChange={(e) => setNewRule((p) => ({ ...p, scoreChange: Number(e.target.value) }))}
              className="h-9 rounded-sf border border-sf-border bg-sf-surface px-3 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveNew}>保存</Button>
            <Button variant="secondary" onClick={() => setShowNew(false)}>キャンセル</Button>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ルール名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">カテゴリ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">トリガー</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">スコア変化</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">スコアリングルールがありません</td></tr>
            ) : rules.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-sf-text">{r.name}</td>
                <td className="px-4 py-3 text-sf-weak">{r.category === "behavior" ? "行動" : "属性"}</td>
                <td className="px-4 py-3 text-sf-weak">{TRIGGER_LABELS[r.triggerType] ?? r.triggerType}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold text-sm ${r.scoreChange > 0 ? "text-green-600" : "text-red-600"}`}>
                    {r.scoreChange > 0 ? `+${r.scoreChange}` : r.scoreChange}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(r.id, r.isActive)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${r.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${r.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
