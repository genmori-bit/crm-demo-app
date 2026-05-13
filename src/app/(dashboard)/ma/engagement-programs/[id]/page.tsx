"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Enrollment {
  enrolledAt: string;
  status: string;
  prospect: { id: string; email: string; firstName: string | null; lastName: string | null };
}
interface Program {
  id: string; name: string; description: string | null; status: string; updatedAt: string;
  nodes: { id: string; type: string; label: string }[];
  _count: { enrollments: number };
  enrollments: Enrollment[];
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  active: { label: "有効", cls: "bg-green-100 text-green-700" },
  paused: { label: "一時停止", cls: "bg-yellow-100 text-yellow-700" },
  completed: { label: "完了", cls: "bg-blue-100 text-blue-700" },
};

const NODE_ICONS: Record<string, string> = {
  email: "📧", wait: "⏱️", condition: "🔀", action: "⚡",
};

export default function EngagementProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [program, setProgram] = useState<Program | null>(null);

  const load = () => fetch(`/api/ma/engagement-programs/${id}`).then((r) => r.json()).then(setProgram);
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    await fetch(`/api/ma/engagement-programs/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast("ステータスを更新しました", "success");
    load();
  };

  if (!program) return <div className="p-6 text-sf-weak">読み込み中...</div>;
  const st = STATUS_LABELS[program.status] ?? { label: program.status, cls: "bg-gray-100 text-gray-600" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ma/engagement-programs" className="text-xs text-sf-weak hover:underline">← エンゲージメントプログラム一覧</Link>
          <h1 className="text-xl font-bold text-sf-text mt-1">{program.name}</h1>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
        </div>
        <div className="flex gap-2">
          {program.status === "draft" && <Button onClick={() => setStatus("active")}>有効化</Button>}
          {program.status === "active" && <Button variant="secondary" onClick={() => setStatus("paused")}>一時停止</Button>}
          {program.status === "paused" && <Button onClick={() => setStatus("active")}>再開</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Nodes / Steps */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-sf-text">プログラムステップ ({program.nodes.length})</h2>
            </div>
            {program.nodes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-sf-weak mb-2">ステップがありません</p>
                <p className="text-xs text-sf-weak">メール送信・待機・条件分岐などのステップを追加してください</p>
              </div>
            ) : (
              <ol className="space-y-2">
                {program.nodes.map((n, i) => (
                  <li key={n.id} className="flex items-center gap-3 p-3 border border-sf-border rounded-sf">
                    <span className="text-xl">{NODE_ICONS[n.type] ?? "•"}</span>
                    <div>
                      <div className="text-sm font-medium text-sf-text">{n.label}</div>
                      <div className="text-xs text-sf-weak">{n.type}</div>
                    </div>
                    <span className="ml-auto text-xs text-sf-weak">ステップ {i + 1}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Enrollments */}
          <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
            <h2 className="text-sm font-semibold text-sf-text mb-3">登録プロスペクト ({program._count.enrollments})</h2>
            {program.enrollments.length === 0 ? (
              <p className="text-sm text-sf-weak">登録されているプロスペクトがありません</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sf-border">
                  <th className="text-left py-2 text-sf-weak">プロスペクト</th>
                  <th className="text-left py-2 text-sf-weak">状態</th>
                  <th className="text-left py-2 text-sf-weak">登録日</th>
                </tr></thead>
                <tbody className="divide-y divide-sf-border">
                  {program.enrollments.map((e, i) => (
                    <tr key={i}>
                      <td className="py-2">
                        <Link href={`/ma/prospects/${e.prospect.id}`} className="text-primary-600 hover:underline">{e.prospect.email}</Link>
                      </td>
                      <td className="py-2 text-sf-weak">{e.status}</td>
                      <td className="py-2 text-sf-weak">{new Date(e.enrolledAt).toLocaleDateString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-sf-surface border border-sf-border rounded-sf p-4">
          <h2 className="text-sm font-semibold text-sf-text mb-3">統計</h2>
          <div className="text-center border-b border-sf-border pb-3 mb-3">
            <div className="text-3xl font-bold text-sf-text">{program._count.enrollments}</div>
            <div className="text-xs text-sf-weak">登録プロスペクト数</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-sf-text">{program.nodes.length}</div>
            <div className="text-xs text-sf-weak">ステップ数</div>
          </div>
        </div>
      </div>
    </div>
  );
}
