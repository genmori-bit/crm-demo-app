"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface LandingPage {
  id: string; name: string; title: string; slug: string; status: string;
  description: string | null; bodyHtml: string; views: number;
  publishedAt: string | null; updatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  published: { label: "公開中", cls: "bg-green-100 text-green-700" },
  archived: { label: "アーカイブ", cls: "bg-orange-100 text-orange-700" },
};

export default function LandingPageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [preview, setPreview] = useState(false);

  const load = () => fetch(`/api/ma/landing-pages/${id}`).then((r) => r.json()).then(setPage);
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    const res = await fetch(`/api/ma/landing-pages/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { showToast("ステータスを更新しました", "success"); load(); }
  };

  if (!page) return <div className="p-6 text-sf-weak">読み込み中...</div>;
  const st = STATUS_LABELS[page.status] ?? { label: page.status, cls: "bg-gray-100 text-gray-600" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/landing-pages" className="text-xs text-sf-weak hover:underline">← ランディングページ一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{page.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
            <span className="text-xs text-sf-weak font-mono">/{page.slug}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPreview(!preview)}>{preview ? "情報" : "プレビュー"}</Button>
          <Button variant="secondary" onClick={() => router.push(`/ma/landing-pages/${id}/edit`)}>編集</Button>
          {page.status === "draft" && <Button onClick={() => setStatus("published")}>公開</Button>}
          {page.status === "published" && <Button variant="secondary" onClick={() => setStatus("archived")}>アーカイブ</Button>}
        </div>
      </div>

      {preview ? (
        <div className="border border-sf-border rounded-sf bg-white overflow-auto" style={{ minHeight: 400 }}>
          <div dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-sf-surface border border-sf-border rounded-sf p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-sf-weak text-xs">タイトル</dt><dd className="text-sf-text">{page.title}</dd></div>
              <div><dt className="text-sf-weak text-xs">スラッグ</dt><dd className="font-mono text-xs text-sf-text">/{page.slug}</dd></div>
              {page.description && <div className="col-span-2"><dt className="text-sf-weak text-xs">説明</dt><dd className="text-sf-text">{page.description}</dd></div>}
              {page.publishedAt && <div><dt className="text-sf-weak text-xs">公開日</dt><dd className="text-sf-text">{new Date(page.publishedAt).toLocaleDateString("ja-JP")}</dd></div>}
              <div><dt className="text-sf-weak text-xs">更新日</dt><dd className="text-sf-text">{new Date(page.updatedAt).toLocaleDateString("ja-JP")}</dd></div>
            </dl>
          </div>
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">統計</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-sf-text">{page.views.toLocaleString()}</div>
              <div className="text-xs text-sf-weak mt-1">ページビュー</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
