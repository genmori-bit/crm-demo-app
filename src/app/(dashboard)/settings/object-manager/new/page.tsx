"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  ObjectIconPreview,
  ObjectIconPicker,
  ObjectColorPicker,
} from "@/components/ui/object-icon";

export default function NewObjectPage() {
  const router = useRouter();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    labelPlural: "",
    apiName: "",
    description: "",
    icon: "briefcase",
    color: "#4f46e5",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const autoApiName = (label: string) => {
    const cleaned = label.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    return cleaned ? `${cleaned}__c` : "";
  };

  const save = async () => {
    if (!form.label || !form.apiName) {
      showToast("ラベルとAPI名は必須です", "error");
      return;
    }
    if (!form.apiName.endsWith("__c")) {
      showToast("API名は__cで終わる必要があります", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/object-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        labelPlural: form.labelPlural || form.label,
        apiName: form.apiName,
        description: form.description || null,
        icon: form.icon,
        color: form.color,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const obj = await res.json();
      showToast("オブジェクトを作成しました", "success");
      router.push(`/settings/object-manager/${obj.apiName ?? obj.id}`);
    } else {
      const err = await res.json();
      showToast(err.error ?? "作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link
          href="/settings/object-manager"
          className="text-sf-weak hover:text-sf-text transition-colors"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">オブジェクトマネージャー</p>
          <h1 className="text-xl font-bold text-sf-text">新規カスタムオブジェクト</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border divide-y divide-sf-border">

          {/* Icon & Color section */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-sf-text mb-1">アイコンと色</p>
              <p className="text-xs text-sf-weak">オブジェクトを識別するアイコンと色を選択してください</p>
            </div>

            {/* Preview */}
            <ObjectIconPreview
              iconId={form.icon}
              color={form.color}
              label={form.label || "オブジェクト名"}
            />

            {/* Color picker */}
            <div>
              <p className="text-xs font-medium text-sf-text mb-2">色</p>
              <ObjectColorPicker
                value={form.color}
                onChange={(hex) => set("color", hex)}
              />
            </div>

            {/* Icon picker */}
            <div>
              <p className="text-xs font-medium text-sf-text mb-2">アイコン</p>
              <ObjectIconPicker
                value={form.icon}
                onChange={(iconId) => set("icon", iconId)}
                previewColor={form.color}
              />
            </div>
          </div>

          {/* Name & API section */}
          <div className="p-6 space-y-4">
            <p className="text-sm font-semibold text-sf-text">基本情報</p>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-sf-text">
                  ラベル (単数形) <span className="text-error">*</span>
                </span>
                <input
                  className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                  value={form.label}
                  onChange={(e) => {
                    set("label", e.target.value);
                    if (!form.apiName || form.apiName === autoApiName(form.label)) {
                      set("apiName", autoApiName(e.target.value));
                    }
                  }}
                  placeholder="例: プロジェクト"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-sf-text">ラベル (複数形)</span>
                <input
                  className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                  value={form.labelPlural}
                  onChange={(e) => set("labelPlural", e.target.value)}
                  placeholder="例: プロジェクト一覧"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-sf-text">
                API名 <span className="text-error">*</span>
              </span>
              <input
                className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-400"
                value={form.apiName}
                onChange={(e) => set("apiName", e.target.value)}
                placeholder="例: Project__c"
              />
              <p className="text-2xs text-sf-weak mt-1">
                英数字・アンダースコアのみ使用可。必ず <code className="font-mono bg-sf-bg px-1 rounded">__c</code> で終わらせてください。
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-sf-text">説明</span>
              <textarea
                className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="このオブジェクトの用途を説明してください（任意）"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex gap-3 bg-sf-bg/50">
            <button
              onClick={save}
              disabled={saving}
              className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "作成中..." : "作成"}
            </button>
            <Link
              href="/settings/object-manager"
              className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
