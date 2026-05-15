"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ObjectDef {
  id: string;
  label: string;
  labelPlural: string;
  apiName: string;
  description: string | null;
}

interface FieldDef {
  id: string;
  label: string;
  apiName: string;
  fieldType: string;
  isRequired: boolean;
  sortOrder: number;
}

interface CustomRecord {
  id: string;
  name: string;
  values: Record<string, unknown>;
  createdAt: string;
}

export default function CustomObjectListPage() {
  const { objectApiName } = useParams<{ objectApiName: string }>();
  const [objectDef, setObjectDef] = useState<ObjectDef | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [records, setRecords] = useState<CustomRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);

    Promise.all([
      fetch(`/api/custom/${objectApiName}?${params}`).then((r) => r.json()),
      fetch(`/api/object-manager`).then((r) => r.json()).then((data: ObjectDef[]) =>
        data.find((o) => o.apiName === objectApiName)
      ),
    ]).then(([data, obj]) => {
      if (obj) setObjectDef(obj as ObjectDef);
      setRecords(data.records ?? []);
      setTotal(data.total ?? 0);
      if (obj) {
        fetch(`/api/object-manager/fields?objectId=${(obj as ObjectDef).id}`)
          .then((r) => r.json())
          .then((f) => setFields(Array.isArray(f) ? f : []));
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [q, page, objectApiName]);

  const displayFields = fields.slice(0, 4);

  if (!loading && !objectDef) {
    return <div className="p-6 text-sf-weak">オブジェクトが見つかりません</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">カスタムオブジェクト</p>
        <h1 className="text-xl font-bold text-sf-text">
          {objectDef ? objectDef.labelPlural || objectDef.label : objectApiName}
        </h1>
        {objectDef?.description && (
          <p className="text-xs text-sf-weak mt-0.5">{objectDef.description}</p>
        )}
      </div>

      <div className="px-6 py-4 bg-sf-surface border-b border-sf-border flex items-center gap-3">
        <input
          type="search"
          placeholder="名前で検索..."
          className="border border-sf-border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-sf-weak">{total} 件</span>
          <Link
            href={`/custom/${objectApiName}/new`}
            className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700"
          >
            新規レコード
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 bg-sf-surface rounded-sf border border-dashed border-sf-border">
            <p className="text-sf-text font-medium mb-1">レコードがありません</p>
            <p className="text-xs text-sf-weak mb-4">新規レコードを作成してください</p>
            <Link
              href={`/custom/${objectApiName}/new`}
              className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-700"
            >
              最初のレコードを作成
            </Link>
          </div>
        ) : (
          <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sf-border bg-sf-bg">
                  <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak">名前</th>
                  {displayFields.map((f) => (
                    <th key={f.id} className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak hidden md:table-cell">
                      {f.label}
                    </th>
                  ))}
                  <th className="text-left px-4 py-2.5 text-2xs font-semibold text-sf-weak hidden lg:table-cell">作成日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/custom/${objectApiName}/${rec.id}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {rec.name || "（名前なし）"}
                      </Link>
                    </td>
                    {displayFields.map((f) => (
                      <td key={f.id} className="px-4 py-2.5 text-sf-text hidden md:table-cell">
                        {formatValue(rec.values[f.apiName], f.fieldType)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-sf-weak text-xs hidden lg:table-cell">
                      {new Date(rec.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {total > limit && (
              <div className="px-4 py-3 border-t border-sf-border flex items-center justify-between text-xs text-sf-weak">
                <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border border-sf-border rounded disabled:opacity-40 hover:bg-sf-bg"
                  >
                    前へ
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                    className="px-2 py-1 border border-sf-border rounded disabled:opacity-40 hover:bg-sf-bg"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatValue(val: unknown, fieldType: string): string {
  if (val === null || val === undefined || val === "") return "—";
  if (fieldType === "BOOLEAN") return val ? "はい" : "いいえ";
  if (fieldType === "DATE" && typeof val === "string") {
    return new Date(val).toLocaleDateString("ja-JP");
  }
  if (fieldType === "DATETIME" && typeof val === "string") {
    return new Date(val).toLocaleString("ja-JP");
  }
  if (fieldType === "CURRENCY" && typeof val === "number") {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(val);
  }
  if (fieldType === "NUMBER" && typeof val === "number") {
    return new Intl.NumberFormat("ja-JP").format(val);
  }
  return String(val);
}
