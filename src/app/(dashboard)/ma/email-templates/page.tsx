"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Template {
  id: string;
  name: string;
  subject: string;
  type: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/ma/email-templates")
      .then((r) => r.json())
      .then((data) => { setTemplates(data); setLoading(false); });
  };

  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await fetch(`/api/ma/email-templates/${id}`, { method: "DELETE" });
    showToast("削除しました", "success");
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">メールテンプレート</h1>
          <p className="text-sm text-sf-weak">{templates.length} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/email-templates/new")}>新規テンプレート</Button>
      </div>

      <div className="bg-sf-surface border border-sf-border rounded-sf overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-sf-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">テンプレート名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">件名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">種類</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak uppercase">更新日</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sf-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">読み込み中...</td></tr>
            ) : templates.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-sf-weak">テンプレートがありません</td></tr>
            ) : templates.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/ma/email-templates/${t.id}`} className="font-medium text-primary-600 hover:underline">{t.name}</Link>
                </td>
                <td className="px-4 py-3 text-sf-weak truncate max-w-xs">{t.subject}</td>
                <td className="px-4 py-3 text-sf-weak">{t.type === "regular" ? "通常" : t.type === "drip" ? "ドリップ" : t.type}</td>
                <td className="px-4 py-3 text-sf-weak text-xs">{new Date(t.updatedAt).toLocaleDateString("ja-JP")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(t.id, t.name)} className="text-xs text-red-500 hover:underline">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
