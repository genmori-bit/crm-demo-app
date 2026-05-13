"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ListDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: boolean;
  updatedAt: string;
  _count: { memberships: number };
  memberships: {
    addedAt: string;
    prospect: { id: string; email: string; firstName: string | null; lastName: string | null; company: string | null; score: number; grade: string };
  }[];
}

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [list, setList] = useState<ListDetail | null>(null);

  const load = () => fetch(`/api/ma/lists/${id}`).then((r) => r.json()).then(setList);
  useEffect(() => { load(); }, [id]);

  const handleRemove = async (prospectId: string, email: string) => {
    if (!confirm(`「${email}」をリストから削除しますか？`)) return;
    await fetch(`/api/ma/lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_prospect", prospectId }),
    });
    showToast("削除しました", "success");
    load();
  };

  if (!list) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/lists" className="text-xs text-sf-weak hover:underline">← リスト一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{list.name}</h1>
          {list.description && <p className="text-sm text-sf-weak">{list.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/ma/prospects?listId=${id}`)}>プロスペクト追加</Button>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-sf-weak">種類: <strong className="text-sf-text">{list.type === "static" ? "静的" : "動的"}</strong></span>
        <span className="text-sf-weak">メンバー数: <strong className="text-sf-text">{list._count.memberships.toLocaleString()} 人</strong></span>
        <span className="text-sf-weak">公開: <strong className="text-sf-text">{list.isPublic ? "公開" : "非公開"}</strong></span>
      </div>

      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">メール / 氏名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">会社</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">スコア</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-sf-weak uppercase">グレード</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">追加日</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {list.memberships.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-sf-weak">メンバーがいません</td></tr>
            ) : list.memberships.map((m) => (
              <tr key={m.prospect.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/ma/prospects/${m.prospect.id}`} className="font-medium text-primary-600 hover:underline block">{m.prospect.email}</Link>
                  {(m.prospect.firstName || m.prospect.lastName) && (
                    <div className="text-xs text-sf-weak">{[m.prospect.firstName, m.prospect.lastName].filter(Boolean).join(" ")}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sf-text">{m.prospect.company ?? "—"}</td>
                <td className="px-4 py-3 text-center font-semibold">{m.prospect.score}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold">{m.prospect.grade}</span>
                </td>
                <td className="px-4 py-3 text-sf-weak text-xs">{new Date(m.addedAt).toLocaleDateString("ja-JP")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleRemove(m.prospect.id, m.prospect.email)} className="text-xs text-red-500 hover:underline">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
