"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  type: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  totalMembers: number;
  respondedCount: number;
  _count: { members: number };
}

const STATUS_COLORS: Record<string, string> = {
  Planning: "bg-gray-100 text-gray-600",
  Active: "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  Aborted: "bg-red-100 text-red-600",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/campaigns?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [q, status]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <p className="text-2xs text-sf-weak">マーケティング</p>
        <h1 className="text-xl font-bold text-sf-text">キャンペーン</h1>
        <p className="text-xs text-sf-weak mt-0.5">マーケティングキャンペーンの計画・追跡</p>
      </div>

      <div className="px-6 py-4 bg-sf-surface border-b border-sf-border flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="キャンペーン名を検索..."
          className="border border-sf-border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border border-sf-border rounded px-3 py-1.5 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">ステータス: すべて</option>
          <option value="Planning">計画中</option>
          <option value="Active">実施中</option>
          <option value="Completed">完了</option>
          <option value="Aborted">中止</option>
        </select>
        <div className="ml-auto">
          <Link href="/campaigns/new" className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規キャンペーン
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sf-border bg-sf-bg sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">キャンペーン名</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">タイプ</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">開始日</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">終了日</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">メンバー数</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">予算</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-sf-bg transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${c.id}`} className="text-primary-600 hover:underline font-medium">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sf-weak">{c.type ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sf-weak">{c.startDate ? new Date(c.startDate).toLocaleDateString("ja-JP") : "—"}</td>
                  <td className="px-4 py-3 text-sf-weak">{c.endDate ? new Date(c.endDate).toLocaleDateString("ja-JP") : "—"}</td>
                  <td className="px-4 py-3 text-sf-text">{c._count.members.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sf-text">{c.budget != null ? `¥${c.budget.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-sf-weak">キャンペーンがありません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
