"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface ObjectDef {
  id: string;
  label: string;
  labelPlural: string;
  apiName: string;
  description: string | null;
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
}

interface FieldDef {
  id: string;
  label: string;
  apiName: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: string | null;
  picklistValues: string[];
  helpText: string | null;
  sortOrder: number;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "テキスト", NUMBER: "数値", DATE: "日付", DATETIME: "日時",
  BOOLEAN: "チェックボックス", PICKLIST: "選択リスト", TEXTAREA: "長文テキスト",
  EMAIL: "メール", PHONE: "電話", URL: "URL", CURRENCY: "通貨", LOOKUP: "参照",
};

export default function ObjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [obj, setObj] = useState<ObjectDef | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    label: "", apiName: "", fieldType: "TEXT", isRequired: false,
    defaultValue: "", picklistValues: "", helpText: "",
  });

  const load = () => {
    Promise.all([
      fetch(`/api/object-manager`).then((r) => r.json()).then((data: ObjectDef[]) => data.find((o) => o.id === id)),
      fetch(`/api/object-manager/fields?objectId=${id}`).then((r) => r.json()),
    ]).then(([objData, fieldsData]) => {
      if (objData) setObj(objData as ObjectDef);
      setFields(Array.isArray(fieldsData) ? fieldsData : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const setF = (k: string, v: string | boolean) => setFieldForm((f) => ({ ...f, [k]: v }));

  const autoApiName = (label: string) => label ? `${label.replace(/\s+/g, "_")}__c` : "";

  const saveField = async () => {
    if (!fieldForm.label || !fieldForm.apiName) { showToast("ラベルとAPI名は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/object-manager/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectId: id,
        label: fieldForm.label,
        apiName: fieldForm.apiName,
        fieldType: fieldForm.fieldType,
        isRequired: fieldForm.isRequired,
        defaultValue: fieldForm.defaultValue || null,
        picklistValues: fieldForm.fieldType === "PICKLIST" ? fieldForm.picklistValues.split("\n").map((v) => v.trim()).filter(Boolean) : [],
        helpText: fieldForm.helpText || null,
        sortOrder: fields.length + 1,
      }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("フィールドを追加しました", "success");
      setAddFieldOpen(false);
      setFieldForm({ label: "", apiName: "", fieldType: "TEXT", isRequired: false, defaultValue: "", picklistValues: "", helpText: "" });
      load();
    } else {
      const err = await res.json();
      showToast(err.error ?? "追加に失敗しました", "error");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!obj) return <div className="p-6 text-sf-weak">見つかりません</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/settings/object-manager" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-2xs text-sf-weak">オブジェクトマネージャー</p>
          <h1 className="text-xl font-bold text-sf-text">{obj.label}</h1>
        </div>
        <Link
          href={`/custom/${obj.apiName}`}
          className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700"
        >
          レコードを表示
        </Link>
      </div>

      <div className="flex-1 p-6 max-w-4xl space-y-6">
        {/* Object info */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-3">オブジェクト情報</h2>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              ["ラベル", obj.label],
              ["複数形ラベル", obj.labelPlural],
              ["API名", obj.apiName],
              ["ステータス", obj.isActive ? "アクティブ" : "非アクティブ"],
              ["種別", obj.isCustom ? "カスタム" : "標準"],
              ["作成日", new Date(obj.createdAt).toLocaleDateString("ja-JP")],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-2xs text-sf-weak">{label}</p>
                <p className="text-sf-text font-mono text-xs">{value}</p>
              </div>
            ))}
          </div>
          {obj.description && (
            <div className="mt-3">
              <p className="text-2xs text-sf-weak mb-1">説明</p>
              <p className="text-sm text-sf-text">{obj.description}</p>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-sf-text">フィールド ({fields.length})</h2>
            {obj.isCustom && (
              <button onClick={() => setAddFieldOpen(true)} className="text-sm text-primary-600 hover:underline font-medium">
                + フィールドを追加
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border">
                <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">ラベル</th>
                <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">API名</th>
                <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">データ型</th>
                <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">必須</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border">
              {/* System fields always present */}
              {[
                { label: "ID", apiName: "id", type: "ID" },
                { label: "名前", apiName: "name", type: "TEXT" },
                { label: "作成日時", apiName: "createdAt", type: "DATETIME" },
              ].map((f) => (
                <tr key={f.apiName} className="opacity-50">
                  <td className="py-2 text-sf-text">{f.label}</td>
                  <td className="py-2 text-sf-weak font-mono text-xs">{f.apiName}</td>
                  <td className="py-2 text-sf-weak">{f.type}</td>
                  <td className="py-2 text-sf-weak">—</td>
                </tr>
              ))}
              {fields.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 text-sf-text">{f.label}</td>
                  <td className="py-2 text-sf-weak font-mono text-xs">{f.apiName}</td>
                  <td className="py-2 text-sf-weak">{FIELD_TYPE_LABELS[f.fieldType] ?? f.fieldType}</td>
                  <td className="py-2">{f.isRequired ? <span className="text-error text-xs">必須</span> : "—"}</td>
                </tr>
              ))}
              {fields.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-xs text-sf-weak">カスタムフィールドなし</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Field Modal */}
      {addFieldOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-sf shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-base font-bold text-sf-text mb-4">フィールドを追加</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-sf-text">ラベル <span className="text-error">*</span></span>
                <input
                  className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm"
                  value={fieldForm.label}
                  onChange={(e) => {
                    setF("label", e.target.value);
                    if (!fieldForm.apiName || fieldForm.apiName === autoApiName(fieldForm.label)) {
                      setF("apiName", autoApiName(e.target.value));
                    }
                  }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-sf-text">API名 <span className="text-error">*</span></span>
                <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm font-mono" value={fieldForm.apiName} onChange={(e) => setF("apiName", e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-sf-text">データ型</span>
                <select className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={fieldForm.fieldType} onChange={(e) => setF("fieldType", e.target.value)}>
                  {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              {fieldForm.fieldType === "PICKLIST" && (
                <label className="block">
                  <span className="text-xs font-medium text-sf-text">選択肢 (1行に1つ)</span>
                  <textarea className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" rows={4} value={fieldForm.picklistValues} onChange={(e) => setF("picklistValues", e.target.value)} placeholder={"選択肢1\n選択肢2\n選択肢3"} />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={fieldForm.isRequired} onChange={(e) => setF("isRequired", e.target.checked)} />
                必須フィールド
              </label>
              <label className="block">
                <span className="text-xs font-medium text-sf-text">ヘルプテキスト</span>
                <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={fieldForm.helpText} onChange={(e) => setF("helpText", e.target.value)} />
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveField} disabled={saving} className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? "追加中..." : "追加"}
              </button>
              <button onClick={() => setAddFieldOpen(false)} className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
