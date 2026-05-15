"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface ObjectDef {
  id: string;
  label: string;
  labelPlural: string;
  apiName: string;
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

export default function NewCustomRecordPage() {
  const { objectApiName } = useParams<{ objectApiName: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [objectDef, setObjectDef] = useState<ObjectDef | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string | boolean | number>>({});

  useEffect(() => {
    fetch("/api/object-manager")
      .then((r) => r.json())
      .then((data: ObjectDef[]) => {
        const obj = data.find((o) => o.apiName === objectApiName);
        if (!obj) { setLoading(false); return; }
        setObjectDef(obj);
        return fetch(`/api/object-manager/fields?objectId=${obj.id}`).then((r) => r.json());
      })
      .then((f) => {
        if (f && Array.isArray(f)) {
          setFields(f);
          const defaults: Record<string, string | boolean | number> = {};
          for (const field of f) {
            if (field.defaultValue !== null) {
              if (field.fieldType === "BOOLEAN") defaults[field.apiName] = field.defaultValue === "true";
              else if (field.fieldType === "NUMBER" || field.fieldType === "CURRENCY") defaults[field.apiName] = Number(field.defaultValue);
              else defaults[field.apiName] = field.defaultValue;
            }
          }
          setValues(defaults);
        }
        setLoading(false);
      });
  }, [objectApiName]);

  const setVal = (apiName: string, val: string | boolean | number) => {
    setValues((v) => ({ ...v, [apiName]: val }));
  };

  const save = async () => {
    if (!name.trim()) { showToast("名前は必須です", "error"); return; }
    for (const f of fields) {
      if (f.isRequired && (values[f.apiName] === undefined || values[f.apiName] === "")) {
        showToast(`${f.label} は必須です`, "error"); return;
      }
    }
    setSaving(true);
    const res = await fetch(`/api/custom/${objectApiName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...values }),
    });
    setSaving(false);
    if (res.ok) {
      const rec = await res.json();
      showToast("レコードを作成しました", "success");
      router.push(`/custom/${objectApiName}/${rec.id}`);
    } else {
      const err = await res.json();
      showToast(err.error ?? "作成に失敗しました", "error");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!objectDef) return <div className="p-6 text-sf-weak">オブジェクトが見つかりません</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href={`/custom/${objectApiName}`} className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">{objectDef.labelPlural || objectDef.label}</p>
          <h1 className="text-xl font-bold text-sf-text">新規レコード</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-sf-text">名前 <span className="text-error">*</span></span>
            <input
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="レコード名"
            />
          </label>

          {fields.map((f) => (
            <label key={f.id} className="block">
              <span className="text-xs font-medium text-sf-text">
                {f.label}
                {f.isRequired && <span className="text-error"> *</span>}
              </span>
              {f.helpText && <p className="text-2xs text-sf-weak mt-0.5">{f.helpText}</p>}
              <FieldInput field={f} value={values[f.apiName]} onChange={(v) => setVal(f.apiName, v)} />
            </label>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "作成中..." : "作成"}
            </button>
            <Link
              href={`/custom/${objectApiName}`}
              className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string | boolean | number | undefined;
  onChange: (v: string | boolean | number) => void;
}) {
  const cls = "mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm";

  switch (field.fieldType) {
    case "BOOLEAN":
      return (
        <div className="mt-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-sf-text">{field.label}</span>
        </div>
      );
    case "TEXTAREA":
      return (
        <textarea
          className={cls}
          rows={3}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "PICKLIST":
      return (
        <select
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">選択してください</option>
          {field.picklistValues.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      );
    case "NUMBER":
    case "CURRENCY":
      return (
        <input
          type="number"
          className={cls}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "DATE":
      return (
        <input
          type="date"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DATETIME":
      return (
        <input
          type="datetime-local"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "EMAIL":
      return (
        <input
          type="email"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "PHONE":
      return (
        <input
          type="tel"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "URL":
      return (
        <input
          type="url"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          className={cls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
