"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { ALLOWED_COLUMNS } from "@/lib/services/report-query-builder";

const OBJECT_TYPES = [
  { value: "deal", label: "商談" },
  { value: "company", label: "企業" },
  { value: "contact", label: "担当者" },
  { value: "activity", label: "活動" },
];

const OPERATORS = [
  { value: "eq", label: "次と等しい" },
  { value: "neq", label: "次と等しくない" },
  { value: "contains", label: "次を含む" },
  { value: "gt", label: "より大きい" },
  { value: "lt", label: "より小さい" },
];

type Filter = { field: string; operator: string; value: string };

export default function NewReportPage() {
  const router = useRouter();
  const showToast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objectType, setObjectType] = useState("deal");
  const [selectedCols, setSelectedCols] = useState<string[]>(["dealName", "stage", "amount", "expectedCloseDate"]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableCols = ALLOWED_COLUMNS[objectType] ?? {};

  const toggleCol = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const addFilter = () => {
    const firstField = Object.keys(availableCols)[0] ?? "createdAt";
    setFilters((prev) => [...prev, { field: firstField, operator: "contains", value: "" }]);
  };

  const updateFilter = (i: number, update: Partial<Filter>) => {
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...update } : f)));
  };

  const removeFilter = (i: number) => {
    setFilters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedCols.length === 0) {
      showToast("レポート名と列を選択してください", "error");
      return;
    }
    setSaving(true);
    try {
      const report = await api.post<{ id: string }>("/api/reports", {
        name,
        description: description || undefined,
        objectType,
        columns: selectedCols,
        filters,
        sortField: sortField || undefined,
        sortDir,
        isPublic,
      });
      showToast("レポートを作成しました");
      router.push(`/reports/${report.id}`);
    } catch {
      showToast("作成に失敗しました", "error");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">レポート</p>
          <h1 className="text-xl font-bold text-sf-text">新規レポート</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push("/reports")}>キャンセル</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-4xl">
        <LightningCard>
          <LightningCardHeader title="基本情報" />
          <LightningCardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-sf-weak mb-1">レポート名 *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="例: 今月のパイプライン"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sf-weak mb-1">説明</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="レポートの説明"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-sf-weak mb-1">対象オブジェクト *</label>
                  <select
                    value={objectType}
                    onChange={(e) => { setObjectType(e.target.value); setSelectedCols([]); setFilters([]); }}
                    className="w-full px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {OBJECT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
                    <span className="text-sm text-sf-text">全員に公開</span>
                  </label>
                </div>
              </div>
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="表示列" />
          <LightningCardBody>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availableCols).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleCol(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCols.includes(key)
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white text-sf-text border-sf-border hover:border-primary-300"
                  }`}
                >
                  {label as string}
                </button>
              ))}
            </div>
            {selectedCols.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sf-border">
                <p className="text-xs text-sf-weak mb-1">選択中: {selectedCols.map((c) => availableCols[c] ?? c).join(", ")}</p>
              </div>
            )}
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader
            title="フィルター"
            action={
              <button onClick={addFilter} className="text-xs text-primary-500 hover:underline">+ 追加</button>
            }
          />
          <LightningCardBody>
            {filters.length === 0 ? (
              <p className="text-sm text-sf-weak">フィルターなし</p>
            ) : (
              <div className="space-y-3">
                {filters.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={f.field}
                      onChange={(e) => updateFilter(i, { field: e.target.value })}
                      className="px-2 py-1.5 border border-sf-border rounded-sf text-xs text-sf-text bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {Object.entries(availableCols).map(([k, v]) => (
                        <option key={k} value={k}>{v as string}</option>
                      ))}
                    </select>
                    <select
                      value={f.operator}
                      onChange={(e) => updateFilter(i, { operator: e.target.value })}
                      className="px-2 py-1.5 border border-sf-border rounded-sf text-xs text-sf-text bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {OPERATORS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      value={f.value}
                      onChange={(e) => updateFilter(i, { value: e.target.value })}
                      placeholder="値"
                      className="flex-1 px-2 py-1.5 border border-sf-border rounded-sf text-xs text-sf-text bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <button onClick={() => removeFilter(i)} className="text-danger hover:text-danger/80">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="並び順" />
          <LightningCardBody>
            <div className="flex items-center gap-3">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(availableCols).filter(([k]) => !k.includes(".")).map(([k, v]) => (
                  <option key={k} value={k}>{v as string}</option>
                ))}
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="px-3 py-2 border border-sf-border rounded-sf text-sm text-sf-text bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </LightningCardBody>
        </LightningCard>
      </div>
    </div>
  );
}
