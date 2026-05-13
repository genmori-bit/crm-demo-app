"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRIGGER_TYPES = [
  { value: "prospect_created", label: "プロスペクト作成時" },
  { value: "form_submit", label: "フォーム送信時" },
  { value: "email_open", label: "メール開封時" },
  { value: "email_click", label: "メールクリック時" },
  { value: "score_change", label: "スコア変更時" },
  { value: "field_change", label: "フィールド変更時" },
  { value: "date_based", label: "日付指定" },
];

const ACTION_TYPES = [
  { value: "add_to_list", label: "リストに追加" },
  { value: "remove_from_list", label: "リストから削除" },
  { value: "change_score", label: "スコアを変更" },
  { value: "change_status", label: "ステータスを変更" },
  { value: "send_email", label: "メールを送信" },
  { value: "assign_user", label: "担当者を割り当て" },
  { value: "notify_user", label: "通知を送信" },
];

interface Action {
  id: string;
  type: string;
  config: Record<string, string>;
}

export default function NewAutomationRulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("prospect_created");
  const [actions, setActions] = useState<Action[]>([{ id: "a1", type: "change_score", config: { delta: "10" } }]);

  const addAction = () => setActions((p) => [...p, { id: `a${Date.now()}`, type: "add_to_list", config: {} }]);
  const removeAction = (id: string) => setActions((p) => p.filter((a) => a.id !== id));
  const updateAction = (id: string, key: string, val: string) =>
    setActions((p) => p.map((a) => a.id === id ? { ...a, [key]: val } : a));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ma/automation-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null, triggerType, actions }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/automation-rules/${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規オートメーションルール</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="ルール名 *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="説明" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">トリガー *</label>
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}
              className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text">
              {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-sf-surface border border-sf-border rounded-sf p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-sf-text">アクション</h2>
            <button type="button" onClick={addAction} className="text-xs text-primary-600 hover:underline">+ アクション追加</button>
          </div>
          <div className="space-y-3">
            {actions.map((a, i) => (
              <div key={a.id} className="border border-sf-border rounded-sf p-3 flex items-center gap-3">
                <span className="text-xs text-sf-weak w-4">{i + 1}</span>
                <select value={a.type} onChange={(e) => updateAction(a.id, "type", e.target.value)}
                  className="flex-1 h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text">
                  {ACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {actions.length > 1 && (
                  <button type="button" onClick={() => removeAction(a.id)} className="text-xs text-red-500 hover:underline">削除</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>保存（無効状態で作成）</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
