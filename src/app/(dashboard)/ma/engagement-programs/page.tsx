"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Program {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  _count?: { enrollments: number; nodes: number };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: "下書き", cls: "bg-gray-100 text-gray-600" },
  active: { label: "有効", cls: "bg-green-100 text-green-700" },
  paused: { label: "一時停止", cls: "bg-yellow-100 text-yellow-700" },
  completed: { label: "完了", cls: "bg-blue-100 text-blue-700" },
};

export default function EngagementProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ma/engagement-programs").then((r) => r.json()).then((data) => { setPrograms(data); setLoading(false); });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">エンゲージメントプログラム</h1>
          <p className="text-sm text-sf-weak">プロスペクトを自動的にナーチャリングします</p>
        </div>
        <Button onClick={() => router.push("/ma/engagement-programs/new")}>新規プログラム</Button>
      </div>

      {loading ? (
        <p className="text-sf-weak text-sm">読み込み中...</p>
      ) : programs.length === 0 ? (
        <div className="bg-sf-surface border border-sf-border rounded-sf p-12 text-center">
          <p className="text-sf-weak text-sm mb-2">エンゲージメントプログラムがありません</p>
          <p className="text-xs text-sf-weak mb-4">メール送信・待機・条件分岐を組み合わせた自動ナーチャリングを作成します</p>
          <Button onClick={() => router.push("/ma/engagement-programs/new")}>最初のプログラムを作成</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((p) => {
            const st = STATUS_LABELS[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-600" };
            return (
              <Link
                key={p.id}
                href={`/ma/engagement-programs/${p.id}`}
                className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-500 transition-colors block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sf-text">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                </div>
                {p.description && <p className="text-xs text-sf-weak mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex gap-4 text-xs text-sf-weak">
                  {p._count && (
                    <>
                      <span>ステップ: {p._count.nodes}</span>
                      <span>登録数: {p._count.enrollments}</span>
                    </>
                  )}
                  <span>{new Date(p.updatedAt).toLocaleDateString("ja-JP")} 更新</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
