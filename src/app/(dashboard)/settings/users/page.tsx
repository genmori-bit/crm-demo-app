"use client";
import { PageLoading } from "@/components/ui/loading";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  department: string | null;
  title: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  profile: { id: string; name: string } | null;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "管理者", color: "bg-danger/10 text-danger" },
  MANAGER: { label: "マネージャー", color: "bg-warning/10 text-warning" },
  SALES: { label: "営業", color: "bg-primary-50 text-primary-600" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "有効", dot: "bg-success" },
  PENDING: { label: "招待中", dot: "bg-warning" },
  DISABLED: { label: "無効", dot: "bg-sf-weak" },
  LOCKED: { label: "ロック", dot: "bg-danger" },
};

export default function UsersPage() {
  const showToast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/settings/users").then((r) => r.json()).then((data) => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await fetch(`/api/settings/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      showToast(`ユーザーを${newStatus === "ACTIVE" ? "有効" : "無効"}にしました`, "success");
      load();
    } else {
      showToast("更新に失敗しました", "error");
    }
  };

  const filtered = search
    ? users.filter((u) =>
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs text-sf-weak">設定</p>
            <h1 className="text-xl font-bold text-sf-text">ユーザー管理</h1>
            <p className="text-xs text-sf-weak mt-0.5">{users.length}人のユーザー</p>
          </div>
          <button
            onClick={() => router.push("/settings/users/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-sf hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規ユーザー
          </button>
        </div>
      </div>

      <div className="bg-sf-surface border-b border-sf-border px-4 py-2.5 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メールで検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <PageLoading />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-sf-border bg-sf-bg sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">名前</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ロール</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">プロファイル</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">部署</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                <th className="text-left px-4 py-3 text-2xs font-semibold text-sf-weak uppercase tracking-wider">最終ログイン</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border bg-sf-surface">
              {filtered.map((user) => {
                const role = ROLE_LABELS[user.role] ?? { label: user.role, color: "bg-sf-bg text-sf-weak" };
                const status = STATUS_CONFIG[user.status] ?? { label: user.status, dot: "bg-sf-weak" };
                return (
                  <tr key={user.id} className="hover:bg-sf-bg transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/settings/users/${user.id}`} className="text-xs font-semibold text-sf-text hover:text-primary-600 transition-colors">
                            {user.name ?? "(名前なし)"}
                          </Link>
                          <p className="text-2xs text-sf-weak">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium", role.color)}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-sf-weak">{user.profile?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-sf-weak">{user.department ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-2xs text-sf-text">
                        <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-2xs text-sf-weak">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("ja-JP") : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/settings/users/${user.id}`}
                          className="text-2xs text-primary-500 hover:underline"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => toggleStatus(user)}
                          className="text-2xs text-sf-weak hover:text-sf-text transition-colors"
                        >
                          {user.status === "ACTIVE" ? "無効化" : "有効化"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-sf-weak">
                    {search ? "検索条件に一致するユーザーがいません" : "ユーザーがいません"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
