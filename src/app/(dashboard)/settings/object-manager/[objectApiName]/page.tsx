"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { STANDARD_OBJECT_ROUTES } from "@/lib/object-registry";

interface ObjectDef {
  id: string;
  label: string;
  labelPlural: string;
  apiName: string;
  description: string | null;
  objectType: string;
  category: string;
  isCustom: boolean;
  isActive: boolean;
  isSearchable: boolean;
  isReportable: boolean;
  isAuditable: boolean;
  enableActivities: boolean;
  enableNotes: boolean;
  enableFiles: boolean;
  enableHistory: boolean;
  createdAt: string;
  fieldCount: number;
  recordCount: number | null;
  fields: FieldDef[];
}

interface FieldDef {
  id: string;
  label: string;
  apiName: string;
  fieldType: string;
  isRequired: boolean;
  isUnique: boolean;
  isSystem: boolean;
  defaultValue: string | null;
  picklistValues: string[];
  helpText: string | null;
  sortOrder: number;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "テキスト", NUMBER: "数値", DATE: "日付", DATETIME: "日時",
  BOOLEAN: "チェックボックス", PICKLIST: "選択リスト", TEXTAREA: "長文テキスト",
  EMAIL: "メール", PHONE: "電話", URL: "URL", CURRENCY: "通貨", LOOKUP: "参照",
  ID: "ID", REFERENCE: "参照",
};

export default function ObjectDetailPage() {
  const { objectApiName } = useParams<{ objectApiName: string }>();
  const showToast = useToast();
  const [obj, setObj] = useState<ObjectDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    label: "", apiName: "", fieldType: "TEXT", isRequired: false,
    defaultValue: "", picklistValues: "", helpText: "",
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/object-manager/${objectApiName}`)
      .then((r) => r.ok ? r.json() : r.json().then((e: { error?: string }) => { throw new Error(e.error ?? "取得失敗"); }))
      .then((data) => { setObj(data); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [objectApiName]);

  const setF = (k: string, v: string | boolean) => setFieldForm((f) => ({ ...f, [k]: v }));
  const autoApiName = (label: string) => label ? `${label.replace(/\s+/g, "_")}__c` : "";

  const saveField = async () => {
    if (!obj) return;
    if (!fieldForm.label || !fieldForm.apiName) { showToast("ラベルとAPI名は必須です", "error"); return; }
    setSaving(true);

    // Get objectId from DB id
    const res = await fetch("/api/object-manager/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectId: obj.id,
        label: fieldForm.label,
        apiName: fieldForm.apiName,
        fieldType: fieldForm.fieldType,
        isRequired: fieldForm.isRequired,
        defaultValue: fieldForm.defaultValue || null,
        picklistValues: fieldForm.fieldType === "PICKLIST"
          ? fieldForm.picklistValues.split("\n").map((v) => v.trim()).filter(Boolean)
          : [],
        helpText: fieldForm.helpText || null,
        sortOrder: (obj.fields?.length ?? 0) + 1,
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

  const routes = obj ? STANDARD_OBJECT_ROUTES[obj.apiName] : null;
  const recordListHref = routes?.list ?? (obj?.isCustom ? `/custom/${obj.apiName}` : null);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !obj) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
          <Link href="/settings/object-manager" className="text-sf-weak hover:text-sf-text">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-sf-text">オブジェクトが見つかりません</h1>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-sf p-4 text-red-700 text-sm">
            {error ?? "このオブジェクト定義が見つかりませんでした。ObjectDefinitionにseedされていない可能性があります。"}
          </div>
          <Link href="/settings/object-manager" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
            ← オブジェクトマネージャーに戻る
          </Link>
        </div>
      </div>
    );
  }

  const systemFields = [
    { label: "ID", apiName: "id", fieldType: "ID", isRequired: true, isUnique: true, isSystem: true },
    { label: "名前", apiName: "name", fieldType: "TEXT", isRequired: true, isUnique: false, isSystem: true },
    { label: "作成日時", apiName: "createdAt", fieldType: "DATETIME", isRequired: true, isUnique: false, isSystem: true },
    { label: "更新日時", apiName: "updatedAt", fieldType: "DATETIME", isRequired: true, isUnique: false, isSystem: true },
  ];

  const allFields = obj.isCustom
    ? [...systemFields, ...obj.fields]
    : obj.fields;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
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
        <div className="flex gap-2">
          {recordListHref && (
            <Link
              href={recordListHref}
              className="border border-sf-border text-sf-text px-4 py-1.5 rounded text-sm font-medium hover:bg-sf-bg"
            >
              レコード一覧を開く
            </Link>
          )}
          {obj.isCustom && (
            <Link
              href={`/custom/${obj.apiName}`}
              className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700"
            >
              レコードを表示
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 max-w-5xl space-y-6">
        {/* Object info */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-sf-text">オブジェクト情報</h2>
            <span className={`text-2xs px-2 py-0.5 rounded-full font-medium ${obj.isCustom ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
              {obj.isCustom ? "カスタム" : "標準"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              ["ラベル", obj.label],
              ["複数形ラベル", obj.labelPlural],
              ["API名", obj.apiName],
              ["カテゴリ", obj.category],
              ["ステータス", obj.isActive ? "アクティブ" : "非アクティブ"],
              ["作成日", new Date(obj.createdAt).toLocaleDateString("ja-JP")],
              ["フィールド数", String(obj.fieldCount)],
              ["レコード数", obj.recordCount !== null ? String(obj.recordCount) : "取得できませんでした"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-2xs text-sf-weak">{label}</p>
                <p className="text-sf-text font-mono text-xs">{value}</p>
              </div>
            ))}
          </div>
          {obj.description && (
            <div className="mt-3 pt-3 border-t border-sf-border">
              <p className="text-2xs text-sf-weak mb-1">説明</p>
              <p className="text-sm text-sf-text">{obj.description}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-3">有効な機能</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["レポート可", obj.isReportable],
              ["検索可", obj.isSearchable],
              ["活動ログ", obj.enableActivities],
              ["メモ", obj.enableNotes],
              ["ファイル", obj.enableFiles],
              ["監査履歴", obj.enableHistory ?? obj.isAuditable],
            ].map(([label, enabled]) => (
              <div key={String(label)} className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  {enabled ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-sf-text">{String(label)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-3">クイックリンク</h2>
          <div className="grid grid-cols-3 gap-3">
            {recordListHref && (
              <Link href={recordListHref} className="flex items-center gap-2 text-xs text-primary-600 hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
                </svg>
                レコード一覧を開く
              </Link>
            )}
            {routes?.maList && (
              <Link href={routes.maList} className="flex items-center gap-2 text-xs text-primary-600 hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                MAで開く
              </Link>
            )}
          </div>
        </div>

        {/* Record Pages */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-sf-text">レコードページ</h2>
            <Link
              href={`/settings/object-manager/${objectApiName}/record-pages`}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              すべて表示 →
            </Link>
          </div>
          <p className="text-xs text-sf-weak mb-3">
            このオブジェクトのレコードページをLightning App Builderスタイルで管理します。
          </p>
          <Link
            href={`/settings/object-manager/${objectApiName}/record-pages`}
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            レコードページを管理
          </Link>
        </div>

        {/* Fields */}
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-sf-text">
              項目とリレーション ({allFields.length})
            </h2>
            {obj.isCustom && (
              <button
                onClick={() => setAddFieldOpen(true)}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                + カスタム項目を追加
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
                <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">種別</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border">
              {allFields.map((f) => (
                <tr key={f.apiName} className={f.isSystem ? "opacity-60" : ""}>
                  <td className="py-2 text-sf-text">{f.label}</td>
                  <td className="py-2 text-sf-weak font-mono text-xs">{f.apiName}</td>
                  <td className="py-2 text-sf-weak">{FIELD_TYPE_LABELS[f.fieldType] ?? f.fieldType}</td>
                  <td className="py-2">
                    {f.isRequired ? <span className="text-error text-xs">必須</span> : <span className="text-sf-weak">—</span>}
                  </td>
                  <td className="py-2">
                    <span className={`text-2xs px-1.5 py-0.5 rounded-full ${f.isSystem ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                      {f.isSystem ? "標準" : "カスタム"}
                    </span>
                  </td>
                </tr>
              ))}
              {allFields.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-sf-weak">
                    項目定義がまだ登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Field Modal */}
      {addFieldOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-sf shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-base font-bold text-sf-text mb-4">カスタム項目を追加</h2>
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
                  <textarea className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" rows={4} value={fieldForm.picklistValues} onChange={(e) => setF("picklistValues", e.target.value)} />
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
