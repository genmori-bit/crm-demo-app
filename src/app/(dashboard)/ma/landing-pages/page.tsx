"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface LandingPage {
  id: string;
  name: string;
  title: string;
  slug: string;
  status: string;
  views: number;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  published: { label: "公開中", cls: "bg-green-100 text-green-700" },
  archived: { label: "アーカイブ", cls: "bg-orange-100 text-orange-700" },
};

export default function LandingPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ma/landing-pages").then((r) => r.json()).then((data) => { setPages(data); setLoading(false); });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">ランディングページ</h1>
          <p className="text-sm text-sf-weak">{pages.length} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/landing-pages/new")}>新規ページ</Button>
      </div>

      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ページ名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">URL スラッグ</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">ステータス</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">表示数</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">更新日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : pages.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">ランディングページがありません</td></tr>
            ) : pages.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/ma/landing-pages/${p.id}`} className="font-medium text-primary-600 hover:underline block">{p.name}</Link>
                    <div className="text-xs text-sf-weak">{p.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sf-weak font-mono text-xs">/{p.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-sf-text">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sf-weak text-xs">{new Date(p.updatedAt).toLocaleDateString("ja-JP")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
