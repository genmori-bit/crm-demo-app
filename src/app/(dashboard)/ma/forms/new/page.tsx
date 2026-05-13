"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FormField {
  id: string;
  type: string;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "f1", type: "email", label: "メールアドレス", name: "email", required: true, placeholder: "example@company.com" },
  { id: "f2", type: "text", label: "名", name: "firstName", required: false, placeholder: "太郎" },
  { id: "f3", type: "text", label: "姓", name: "lastName", required: false, placeholder: "山田" },
  { id: "f4", type: "text", label: "会社名", name: "company", required: false, placeholder: "株式会社〇〇" },
];

export default function NewFormPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thankYouMsg, setThankYouMsg] = useState("お問い合わせありがとうございます。担当者よりご連絡いたします。");
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);

  const addField = () => {
    setFields((prev) => [...prev, {
      id: `f${Date.now()}`, type: "text", label: "新しいフィールド", name: `field_${Date.now()}`, required: false,
    }]);
  };

  const updateField = (id: string, key: keyof FormField, val: string | boolean) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, [key]: val } : f));
  };

  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ma/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null, fields, thankYouMsg }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/ma/forms/${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error || "保存に失敗しました");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-sf-text mb-6">新規フォーム</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5 space-y-4">
          <Input label="フォーム名 *" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="block text-xs font-medium text-sf-text mb-1">説明</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-sf border border-sf-border bg-sf-surface px-3 py-2 text-sm text-sf-text resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Input label="完了メッセージ" value={thankYouMsg} onChange={(e) => setThankYouMsg(e.target.value)} />
        </div>

        {/* Fields */}
        <div className="bg-sf-surface border border-sf-border rounded-sf p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-sf-text">フォームフィールド</h2>
            <button type="button" onClick={addField} className="text-xs text-primary-600 hover:underline">+ フィールド追加</button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="border border-sf-border rounded-sf p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sf-weak">フィールド {i + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => removeField(f.id)} className="text-xs text-red-500 hover:underline">削除</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="ラベル" value={f.label} onChange={(e) => updateField(f.id, "label", e.target.value)} />
                  <div>
                    <label className="block text-xs font-medium text-sf-text mb-1">タイプ</label>
                    <select value={f.type} onChange={(e) => updateField(f.id, "type", e.target.value)}
                      className="w-full h-9 rounded-sf border border-sf-border bg-sf-surface px-2 text-sm text-sf-text">
                      <option value="text">テキスト</option>
                      <option value="email">メール</option>
                      <option value="tel">電話</option>
                      <option value="textarea">テキストエリア</option>
                      <option value="select">選択</option>
                      <option value="checkbox">チェックボックス</option>
                    </select>
                  </div>
                  <Input label="フィールド名" value={f.name} onChange={(e) => updateField(f.id, "name", e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-xs text-sf-text cursor-pointer">
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, "required", e.target.checked)} className="rounded" />
                  必須
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>保存</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>キャンセル</Button>
        </div>
      </form>
    </div>
  );
}
