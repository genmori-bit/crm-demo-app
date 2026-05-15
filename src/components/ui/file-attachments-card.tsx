"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  createdAt: string;
}

interface FileAttachmentsCardProps {
  /** API base URL e.g. /api/companies/xxx/files */
  apiBase: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("docx") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("xlsx")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || mimeType.includes("pptx")) return "📑";
  if (mimeType.startsWith("image/")) return "🖼";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "📦";
  return "📎";
}

export function FileAttachmentsCard({ apiBase }: FileAttachmentsCardProps) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(apiBase)
      .then((r) => r.json())
      .then((data) => { setFiles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setShowForm(true);
    setDescription("");
    setError(null);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", pendingFile);
    if (description.trim()) fd.append("description", description.trim());

    const res = await fetch(apiBase, { method: "POST", body: fd });
    if (res.ok) {
      setPendingFile(null);
      setShowForm(false);
      setDescription("");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "アップロードに失敗しました");
    }
    setUploading(false);
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`「${fileName}」を削除してもよろしいですか？`)) return;
    await fetch(`${apiBase}/${fileId}`, { method: "DELETE" });
    load();
  };

  const handleDownload = (fileId: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = `${apiBase}/${fileId}`;
    a.download = fileName;
    a.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <LightningCard>
      <LightningCardHeader
        title="ファイル"
        count={files.length}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        }
        action={
          <Button
            size="xs"
            variant="neutral"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            アップロード
          </Button>
        }
      />

      <LightningCardBody>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
        />

        {/* Upload form */}
        {showForm && pendingFile && (
          <div className="mb-4 p-3 bg-info-light/40 border border-info-border rounded-sf">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg shrink-0">{fileIcon(pendingFile.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sf-text truncate">{pendingFile.name}</p>
                <p className="text-xs text-sf-weak">{formatBytes(pendingFile.size)}</p>
              </div>
              <button onClick={() => { setPendingFile(null); setShowForm(false); }} className="text-sf-weak hover:text-sf-text shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="説明（任意）"
              className="w-full h-8 px-2.5 text-xs border border-sf-border rounded-sf bg-white focus:outline-none focus:border-primary-500 mb-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUpload(); }}
            />
            {error && <p className="text-xs text-danger mb-2">{error}</p>}
            <div className="flex gap-2">
              <Button size="xs" onClick={handleUpload} disabled={uploading}>
                {uploading ? "アップロード中..." : "アップロード"}
              </Button>
              <Button size="xs" variant="neutral" onClick={() => { setPendingFile(null); setShowForm(false); }}>
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* Drop zone (when no pending file) */}
        {!showForm && (
          <div
            className={`mb-3 border-2 border-dashed rounded-sf p-4 text-center cursor-pointer transition-colors ${dragOver ? "border-primary-400 bg-info-light/30" : "border-sf-border/60 hover:border-primary-300 hover:bg-sf-bg/50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-6 h-6 mx-auto mb-1 text-sf-weak" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs text-sf-weak">クリックまたはドラッグ&ドロップでアップロード</p>
            <p className="text-2xs text-sf-weak/70 mt-0.5">最大10MB · PDF, Word, Excel, PowerPoint等</p>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <p className="text-xs text-sf-weak text-center py-2">読み込み中...</p>
        ) : files.length === 0 ? (
          <p className="text-xs text-sf-weak text-center py-2">ファイルがありません</p>
        ) : (
          <div className="divide-y divide-sf-border/60 -mx-4">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-sf-bg/50 group">
                <span className="text-xl shrink-0">{fileIcon(f.mimeType)}</span>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => handleDownload(f.id, f.fileName)}
                    className="text-sm font-medium text-primary-600 hover:underline hover:text-primary-700 text-left truncate block max-w-full"
                  >
                    {f.fileName}
                  </button>
                  <p className="text-xs text-sf-weak">
                    {formatBytes(f.fileSize)}
                    {f.description && <span> · {f.description}</span>}
                    <span> · {new Date(f.createdAt).toLocaleDateString("ja-JP")}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleDownload(f.id, f.fileName)}
                    className="w-7 h-7 flex items-center justify-center rounded text-sf-weak hover:text-primary-600 hover:bg-info-light transition-colors"
                    title="ダウンロード"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(f.id, f.fileName)}
                    className="w-7 h-7 flex items-center justify-center rounded text-sf-weak hover:text-danger hover:bg-danger-light transition-colors"
                    title="削除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </LightningCardBody>
    </LightningCard>
  );
}
