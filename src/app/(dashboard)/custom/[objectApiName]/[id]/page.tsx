"use client";
import { PageLoading } from "@/components/ui/loading";

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

interface CustomRecord {
  id: string;
  name: string;
  values: Record<string, unknown>;
  createdAt: string;
}

export default function CustomRecordDetailPage() {
  const { objectApiName, id } = useParams<{ objectApiName: string; id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [objectDef, setObjectDef] = useState<ObjectDef | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [record, setRecord] = useState<CustomRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string | boolean | number>>({});

  const load = () => {
    Promise.all([
      fetch(`/api/custom/${objectApiName}/${id}`).then((r) => r.json()),
      fetch("/api/object-manager").then((r) => r.json()).then((data: ObjectDef[]) =>
        data.find((o) => o.apiName === objectApiName)
      ),
    ]).then(([data, obj]) => {
      if (data.record) {
        setRecord(data.record);
        setEditName(data.record.name);
        setEditValues(data.record.values as Record<string, string | boolean | number>);
      }
      if (obj) {
        setObjectDef(obj as ObjectDef);
        fetch(`/api/object-manager/fields?objectId=${(obj as ObjectDef).id}`)
          .then((r) => r.json())
          .then((f) => setFields(Array.isArray(f) ? f : []));
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id, objectApiName]);

  const startEdit = () => {
    if (!record) return;
    setEditName(record.name);
    setEditValues(record.values as Record<string, string | boolean | number>);
    setEditing(true);
  };

  const save = async () => {
    if (!editName.trim()) { showToast("名前は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch(`/api/custom/${objectApiName}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, ...editValues }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("保存しました", "success");
      setEditing(false);
      load();
    } else {
      showToast("保存に失敗しました", "error");
    }
  };

  const deleteRecord = async () => {
    if (!confirm("このレコードを削除しますか？")) return;
    setDeleting(true);
    const res = await fetch(`/api/custom/${objectApiName}/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      showToast("削除しました", "success");
      router.push(`/custom/${objectApiName}`);
    } else {
      showToast("削除に失敗しました", "error");
    }
  };

  if (loading) return <PageLoading />;
  if (!record || !objectDef) return <div className="p-6 text-sf-weak">レコードが見つかりません</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href={`/custom/${objectApiName}`} className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-2xs text-sf-weak">{objectDef.labelPlural || objectDef.label}</p>
          <h1 className="text-xl font-bold text-sf-text">{record.name || "（名前なし）"}</h1>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={startEdit}
                className="border border-sf-border text-sf-text px-4 py-1.5 rounded text-sm font-medium hover:bg-sf-bg"
              >
                編集
              </button>
              <button
                onClick={deleteRecord}
                disabled={deleting}
                className="border border-error text-error px-4 py-1.5 rounded text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-sf-border text-sf-text px-4 py-1.5 rounded text-sm font-medium hover:bg-sf-bg"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl space-y-6">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6">
          <h2 className="text-sm font-semibold text-sf-text mb-4">レコード情報</h2>
          <div className="space-y-4">
            <div>
              <p className="text-2xs text-sf-weak mb-1">名前</p>
              {editing ? (
                <input
                  className="w-full border border-sf-border rounded px-3 py-1.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                <p className="text-sm text-sf-text">{record.name || "—"}</p>
              )}
            </div>

            {fields.map((f) => (
              <div key={f.id}>
                <p className="text-2xs text-sf-weak mb-1">
                  {f.label}
                  {f.isRequired && <span className="text-error"> *</span>}
                </p>
                {editing ? (
                  <FieldInput
                    field={f}
                    value={editValues[f.apiName]}
                    onChange={(v) => setEditValues((ev) => ({ ...ev, [f.apiName]: v }))}
                  />
                ) : (
                  <p className="text-sm text-sf-text">
                    {formatValue(record.values[f.apiName], f.fieldType)}
                  </p>
                )}
                {f.helpText && editing && <p className="text-2xs text-sf-weak mt-0.5">{f.helpText}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
          <h2 className="text-sm font-semibold text-sf-text mb-3">システム情報</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-2xs text-sf-weak">ID</p>
              <p className="text-xs font-mono text-sf-text">{record.id}</p>
            </div>
            <div>
              <p className="text-2xs text-sf-weak">作成日時</p>
              <p className="text-xs text-sf-text">{new Date(record.createdAt).toLocaleString("ja-JP")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatValue(val: unknown, fieldType: string): string {
  if (val === null || val === undefined || val === "") return "—";
  if (fieldType === "BOOLEAN") return val ? "はい" : "いいえ";
  if (fieldType === "DATE" && typeof val === "string") return new Date(val).toLocaleDateString("ja-JP");
  if (fieldType === "DATETIME" && typeof val === "string") return new Date(val).toLocaleString("ja-JP");
  if (fieldType === "CURRENCY" && typeof val === "number") {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);
  }
  if (fieldType === "NUMBER" && typeof val === "number") return new Intl.NumberFormat("ja-JP").format(val);
  if (fieldType === "URL" && typeof val === "string") return val;
  if (fieldType === "EMAIL" && typeof val === "string") return val;
  if (fieldType === "PHONE" && typeof val === "string") return val;
  return String(val);
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
  const cls = "w-full border border-sf-border rounded px-3 py-1.5 text-sm";

  switch (field.fieldType) {
    case "BOOLEAN":
      return (
        <div>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="mr-2" />
          <span className="text-sm text-sf-text">{field.label}</span>
        </div>
      );
    case "TEXTAREA":
      return <textarea className={cls} rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "PICKLIST":
      return (
        <select className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">選択してください</option>
          {field.picklistValues.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    case "NUMBER":
    case "CURRENCY":
      return <input type="number" className={cls} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "DATE":
      return <input type="date" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "DATETIME":
      return <input type="datetime-local" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "EMAIL":
      return <input type="email" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "PHONE":
      return <input type="tel" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "URL":
      return <input type="url" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input type="text" className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}
