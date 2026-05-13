"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface MarketingList {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  updatedAt: string;
  _count: { memberships: number };
}

export default function ListsPage() {
  const router = useRouter();
  const showToast = useToast();
  const [lists, setLists] = useState<MarketingList[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/lists").then((r) => r.json()).then((data) => { setLists(data); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/ma/lists/${id}`, { method: "DELETE" });
    showToast("削除しました", "success");
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">リスト</h1>
          <p className="text-sm text-sf-weak">{lists.length} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/lists/new")}>新規リスト</Button>
      </div>

      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">リスト名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">種類</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak uppercase">メンバー数</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">公開</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">更新日</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : lists.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">リストがありません</td></tr>
            ) : lists.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/ma/lists/${l.id}`} className="font-medium text-primary-600 hover:underline">{l.name}</Link>
                  {l.description && <div className="text-xs text-sf-weak truncate max-w-xs">{l.description}</div>}
                </td>
                <td className="px-4 py-3 text-sf-weak">{l.type === "static" ? "静的" : "動的"}</td>
                <td className="px-4 py-3 text-right font-semibold text-sf-text">{l._count.memberships.toLocaleString()}</td>
                <td className="px-4 py-3 text-sf-weak">{l.isPublic ? "公開" : "非公開"}</td>
                <td className="px-4 py-3 text-sf-weak text-xs">{new Date(l.updatedAt).toLocaleDateString("ja-JP")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(l.id, l.name)} className="text-xs text-red-500 hover:underline">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
