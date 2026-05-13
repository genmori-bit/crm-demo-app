"use client";

import { useEffect, useRef, useState } from "react";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ImportJob {
  id: string;
  objectType: string;
  fileName: string;
  status: string;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: { row: number; message: string }[];
  createdAt: string;
  completedAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  processing: "bg-primary-50 text-primary-600",
  pending: "bg-sf-bg text-sf-weak",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "完了",
  failed: "失敗",
  processing: "処理中",
  pending: "待機中",
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
}

const FIELD_MAP: Record<string, Record<string, string>> = {
  company: {
    "会社名": "companyName",
    "業種": "industry",
    "ステータス": "status",
    "規模": "employeeSize",
    "担当者": "ownerName",
    "電話": "phone",
    "Web": "website",
    "メモ": "memo",
  },
};

export default function ImportPage() {
  const showToast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<ImportJob[] | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [objectType] = useState("company");
  const [importing, setImporting] = useState(false);

  const loadJobs = () => api.get<ImportJob[]>("/api/import").then(setJobs);
  useEffect(() => { loadJobs(); }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rawRows = parseCsv(text);
      const fieldMap = FIELD_MAP[objectType] ?? {};
      const rows = rawRows.map((r) => {
        const mapped: Record<string, string> = {};
        for (const [jpKey, enKey] of Object.entries(fieldMap)) {
          if (r[jpKey] !== undefined) mapped[enKey] = r[jpKey];
        }
        return { ...r, ...mapped };
      });
      await api.post("/api/import", { objectType, fileName, rows });
      showToast("インポートが完了しました");
      setPreview(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      loadJobs();
    } catch {
      showToast("インポートに失敗しました", "error");
    } finally {
      setImporting(false);
    }
  };

  if (!jobs) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">設定</p>
        <h1 className="text-xl font-bold text-sf-text">データインポート</h1>
      </div>

      <div className="p-6 space-y-4 max-w-4xl">
        <LightningCard>
          <LightningCardHeader title="CSVファイルをアップロード" />
          <LightningCardBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-sf-weak mb-3">
                  企業データをCSVファイルからインポートします。<br />
                  必須列: <code className="bg-sf-bg px-1 py-0.5 rounded text-xs">会社名</code>
                  &nbsp;任意列: 業種, ステータス, 規模, 担当者, 電話, Web, メモ
                </p>
                <div
                  className="border-2 border-dashed border-sf-border rounded-sf p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <svg className="w-10 h-10 text-sf-weak mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-sf-weak">
                    {fileName ? (
                      <span className="text-primary-500 font-medium">{fileName}</span>
                    ) : "クリックしてCSVファイルを選択"}
                  </p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </div>

              {preview && (
                <div>
                  <p className="text-xs font-medium text-sf-weak mb-2">プレビュー（先頭5行）</p>
                  <div className="overflow-x-auto border border-sf-border rounded-sf">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-sf-bg/50 border-b border-sf-border">
                          {Object.keys(preview[0] ?? {}).map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-sf-weak">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sf-border">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-3 py-2 text-sf-text">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={handleImport} disabled={importing}>
                      {importing ? "インポート中..." : "インポート実行"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </LightningCardBody>
        </LightningCard>

        <LightningCard>
          <LightningCardHeader title="インポート履歴" />
          {jobs.length === 0 ? (
            <LightningCardBody>
              <p className="text-sm text-sf-weak text-center py-4">インポート履歴がありません</p>
            </LightningCardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border bg-sf-bg/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">ファイル名</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">ステータス</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-sf-weak">合計</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-sf-weak">成功</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-sf-weak">エラー</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-sf-weak">実行日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-sf-bg/40">
                      <td className="px-4 py-3 text-sf-text font-medium">{job.fileName}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[job.status] ?? "bg-sf-bg text-sf-weak")}>
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sf-text">{job.totalRows}</td>
                      <td className="px-4 py-3 text-right text-success font-medium">{job.importedRows}</td>
                      <td className="px-4 py-3 text-right text-danger font-medium">{job.errorRows}</td>
                      <td className="px-4 py-3 text-sf-weak text-xs">{formatDateTime(job.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LightningCard>
      </div>
    </div>
  );
}
