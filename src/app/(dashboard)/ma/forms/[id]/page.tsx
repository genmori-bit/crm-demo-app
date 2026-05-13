"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface FormDetail {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  thankYouMsg: string | null;
  redirectUrl: string | null;
  updatedAt: string;
  fields: { id: string; type: string; label: string; name: string; required: boolean }[];
  _count: { submissions: number };
  submissions: {
    submittedAt: string;
    data: Record<string, unknown>;
    prospect: { id: string; email: string } | null;
  }[];
  handlers: { id: string; name: string; isActive: boolean }[];
}

export default function FormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [form, setForm] = useState<FormDetail | null>(null);

  const load = () => fetch(`/api/ma/forms/${id}`).then((r) => r.json()).then(setForm);
  useEffect(() => { load(); }, [id]);

  const toggleActive = async () => {
    if (!form) return;
    const res = await fetch(`/api/ma/forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !form.isActive }),
    });
    if (res.ok) { showToast(`${form.isActive ? "無効" : "有効"}にしました`, "success"); load(); }
  };

  if (!form) return <div className="p-6 text-sf-weak">読み込み中...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/forms" className="text-xs text-sf-weak hover:underline">← フォーム一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{form.name}</h1>
          {form.description && <p className="text-sm text-sf-weak">{form.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleActive}>
            {form.isActive ? "無効にする" : "有効にする"}
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/ma/forms/${id}/edit`)}>編集</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Fields */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">フィールド構成</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-sf-border">
                <th className="text-left py-2 text-xs text-sf-weak">ラベル</th>
                <th className="text-left py-2 text-xs text-sf-weak">タイプ</th>
                <th className="text-left py-2 text-xs text-sf-weak">フィールド名</th>
                <th className="text-center py-2 text-xs text-sf-weak">必須</th>
              </tr></thead>
              <tbody className="divide-y divide-sf-border">
                {form.fields.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2 text-sf-text">{f.label}</td>
                    <td className="py-2 text-sf-weak">{f.type}</td>
                    <td className="py-2 text-sf-weak font-mono text-xs">{f.name}</td>
                    <td className="py-2 text-center">{f.required ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submissions */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">最近の送信 ({form._count.submissions} 件)</h2>
            {form.submissions.length === 0 ? (
              <p className="text-sm text-sf-weak">送信データなし</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sf-border">
                  <th className="text-left py-2 text-sf-weak">送信日時</th>
                  <th className="text-left py-2 text-sf-weak">プロスペクト</th>
                  <th className="text-left py-2 text-sf-weak">データ</th>
                </tr></thead>
                <tbody className="divide-y divide-sf-border">
                  {form.submissions.map((s, i) => (
                    <tr key={i}>
                      <td className="py-2 text-sf-weak">{new Date(s.submittedAt).toLocaleString("ja-JP")}</td>
                      <td className="py-2">
                        {s.prospect ? (
                          <Link href={`/ma/prospects/${s.prospect.id}`} className="text-primary-600 hover:underline">{s.prospect.email}</Link>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-sf-text">{Object.entries(s.data as Record<string,unknown>).map(([k, v]) => `${k}: ${v}`).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">ステータス</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sf-weak">状態</span>
                <span className={`font-medium ${form.isActive ? "text-green-600" : "text-gray-400"}`}>
                  {form.isActive ? "有効" : "無効"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sf-weak">送信数</span>
                <span className="font-semibold text-sf-text">{form._count.submissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sf-weak">更新日</span>
                <span className="text-sf-weak text-xs">{new Date(form.updatedAt).toLocaleDateString("ja-JP")}</span>
              </div>
            </div>
          </div>

          {form.thankYouMsg && (
            <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
              <h2 className="text-sm font-semibold text-sf-text mb-2">完了メッセージ</h2>
              <p className="text-sm text-sf-weak">{form.thankYouMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
