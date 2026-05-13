"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Form {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
}

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ma/forms").then((r) => r.json()).then((data) => { setForms(data); setLoading(false); });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sf-text">フォーム</h1>
          <p className="text-sm text-sf-weak">{forms.length} 件</p>
        </div>
        <Button onClick={() => router.push("/ma/forms/new")}>新規フォーム</Button>
      </div>

      {loading ? (
        <p className="text-sf-weak text-sm">読み込み中...</p>
      ) : forms.length === 0 ? (
        <div className="bg-sf-surface border border-sf-border rounded-sf p-12 text-center">
          <p className="text-sf-weak text-sm">フォームがありません</p>
          <Button className="mt-4" onClick={() => router.push("/ma/forms/new")}>最初のフォームを作成</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f) => (
            <Link
              key={f.id}
              href={`/ma/forms/${f.id}`}
              className="bg-sf-surface border border-sf-border rounded-sf p-4 hover:border-primary-500 transition-colors block"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sf-text">{f.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {f.isActive ? "有効" : "無効"}
                </span>
              </div>
              {f.description && <p className="text-xs text-sf-weak mb-2 line-clamp-2">{f.description}</p>}
              <p className="text-xs text-sf-weak">{new Date(f.updatedAt).toLocaleDateString("ja-JP")} 更新</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
