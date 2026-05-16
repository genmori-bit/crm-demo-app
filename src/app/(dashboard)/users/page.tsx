"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Building2, TrendingUp, CheckSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  department: string | null;
  title: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  manager: { id: string; name: string | null } | null;
  _count: {
    ownedDeals: number;
    accountTeamMemberships: number;
    ownedActivities: number;
    assignedTasks: number;
  };
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "管理者", cls: "bg-danger/10 text-danger" },
  MANAGER: { label: "マネージャー", cls: "bg-warning/10 text-warning" },
  SALES: { label: "営業", cls: "bg-primary-50 text-primary-600" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  ACTIVE: { label: "有効", dot: "bg-success" },
  PENDING: { label: "招待中", dot: "bg-warning" },
  DISABLED: { label: "無効", dot: "bg-sf-weak" },
  LOCKED: { label: "ロック", dot: "bg-danger" },
};

function UserAvatar({ name, size = "md" }: { name: string | null; size?: "sm" | "md" }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "?";
  return (
    <div
      className={cn(
        "rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center shrink-0",
        size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
      )}
    >
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (deptFilter) params.set("department", deptFilter);
    if (roleFilter) params.set("role", roleFilter);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [search, deptFilter, roleFilter]);

  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))] as string[];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">ユーザー</h1>
            <p className="text-xs text-sf-weak">{users.length}名</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-weak" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メール・部署で検索..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-sf-border rounded-lg bg-sf-surface focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-sf-border rounded-lg px-3 py-2 bg-sf-surface focus:outline-none"
        >
          <option value="">全部署</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-sf-border rounded-lg px-3 py-2 bg-sf-surface focus:outline-none"
        >
          <option value="">全ロール</option>
          <option value="ADMIN">管理者</option>
          <option value="MANAGER">マネージャー</option>
          <option value="SALES">営業</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-sf-surface rounded-lg border border-sf-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sf-weak text-sm">読み込み中...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sf-weak text-sm">ユーザーが見つかりません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border bg-sf-background">
                <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ユーザー</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">部署 / 役職</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ロール</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">ステータス</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">担当商談</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">担当取引先</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-sf-weak">未完タスク</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sf-weak">上長</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sf-border">
              {users.map((user) => {
                const role = ROLE_LABELS[user.role] ?? { label: user.role, cls: "bg-sf-background text-sf-weak" };
                const status = STATUS_CONFIG[user.status] ?? { label: user.status, dot: "bg-sf-weak" };
                return (
                  <tr key={user.id} className="hover:bg-sf-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} size="sm" />
                        <div>
                          <Link
                            href={`/users/${user.id}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {user.name ?? "(名前なし)"}
                          </Link>
                          <p className="text-xs text-sf-weak">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sf-text">{user.department ?? "—"}</p>
                      <p className="text-xs text-sf-weak">{user.title ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", role.cls)}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                        <span className="text-sf-text text-xs">{status.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-sf-text">
                        <TrendingUp className="w-3 h-3 text-sf-weak" />
                        <span className="font-medium">{user._count.ownedDeals}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-sf-text">
                        <Building2 className="w-3 h-3 text-sf-weak" />
                        <span className="font-medium">{user._count.accountTeamMemberships}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CheckSquare2 className="w-3 h-3 text-sf-weak" />
                        <span
                          className={cn(
                            "font-medium",
                            user._count.assignedTasks > 0 ? "text-warning" : "text-sf-text"
                          )}
                        >
                          {user._count.assignedTasks}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.manager ? (
                        <Link
                          href={`/users/${user.manager.id}`}
                          className="text-primary-600 hover:underline text-xs"
                        >
                          {user.manager.name}
                        </Link>
                      ) : (
                        <span className="text-sf-weak text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
