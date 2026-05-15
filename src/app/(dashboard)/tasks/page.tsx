"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/ui/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRow } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, isOverdue } from "@/lib/utils";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  company: { id: string; companyName: string } | null;
  deal: { id: string; dealName: string } | null;
}

const LIST_VIEWS = [
  { id: "all",     label: "すべて",   status: "" },
  { id: "today",   label: "今日期限", status: "today" },
  { id: "todo",    label: "未着手",   status: "todo" },
  { id: "in_progress", label: "進行中", status: "in_progress" },
  { id: "done",    label: "完了済",   status: "done" },
];

function TasksInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [activeView, setActiveView] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const statusFilter = LIST_VIEWS.find((v) => v.id === activeView)?.status ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter && statusFilter !== "today") params.set("status", statusFilter);
    const data = await api.get<Task[]>(`/api/tasks?${params}`);
    const filtered = statusFilter === "today"
      ? data.filter((t) => t.dueDate && t.dueDate.slice(0, 10) <= today && t.status !== "done")
      : data;
    setTasks(filtered);
    setLoading(false);
  }, [q, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggleDone = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: newStatus });
      showToast(newStatus === "done" ? "タスクを完了にしました" : "タスクを未着手に戻しました");
      load();
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/tasks/${deleteId}`);
      showToast("タスクを削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">CRM</p>
            <h1 className="text-xl font-bold text-sf-text">タスク</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/tasks/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規タスク
        </Button>
      </div>

      {/* View tabs */}
      <div className="bg-sf-surface border-b border-sf-border px-6 overflow-x-auto">
        <nav className="flex" role="tablist" aria-label="ビュー">
          {LIST_VIEWS.map((view) => (
            <button
              key={view.id}
              role="tab"
              aria-selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none",
                activeView === view.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              )}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="bg-sf-surface border-b border-sf-border px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-sf-weak shrink-0 tabular-nums">
          {loading ? "読み込み中..." : `${tasks.length.toLocaleString()} 件`}
        </span>
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="タスクを検索..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-sf border border-sf-border bg-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="タスクを検索"
          />
        </div>
        <button
          onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-sf text-sf-weak hover:bg-sf-bg border border-sf-border transition-colors ml-auto"
          aria-label="更新"
          title="更新"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-sf-surface">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="bg-sf-bg border-b border-sf-border sticky top-0 z-10">
              <th className="w-10 px-4 py-2.5" />
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">タイトル</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">優先度</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">ステータス</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">期限</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak uppercase tracking-wider whitespace-nowrap">関連先</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="タスクが見つかりません"
                    description="新規タスクを作成するか、検索条件を変えてください"
                    action={<Button onClick={() => router.push("/tasks/new")}>新規タスク作成</Button>}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            ) : tasks.map((t) => {
              const overdue = t.dueDate && isOverdue(t.dueDate) && t.status !== "done";
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-b border-sf-border/60 transition-colors group",
                    overdue ? "bg-danger-light/20 hover:bg-danger-light/40" : "hover:bg-info-light/30"
                  )}
                >
                  <td className="px-4 py-3 w-10">
                    <button
                      onClick={() => handleToggleDone(t)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                        t.status === "done"
                          ? "border-success bg-success"
                          : "border-sf-border hover:border-primary-400"
                      )}
                      aria-label={t.status === "done" ? "未完了に戻す" : "完了にする"}
                    >
                      {t.status === "done" && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn("font-medium leading-snug", t.status === "done" ? "line-through text-sf-weak" : "text-sf-text")}>
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-sf-weak truncate max-w-xs mt-0.5">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TaskPriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs tabular-nums",
                        overdue ? "text-danger font-semibold" : "text-sf-weak"
                      )}>
                        {formatDate(t.dueDate) || "—"}
                      </span>
                      {overdue && (
                        <span className="text-2xs bg-danger/10 text-danger font-semibold px-1.5 py-0.5 rounded">期限超過</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-sf-weak space-y-0.5">
                    {t.company && (
                      <div>
                        <Link
                          href={`/companies/${t.company.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary-600 hover:underline"
                        >
                          {t.company.companyName}
                        </Link>
                      </div>
                    )}
                    {t.deal && (
                      <div>
                        <Link
                          href={`/deals/${t.deal.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-primary-600 hover:underline"
                        >
                          {t.deal.dealName}
                        </Link>
                      </div>
                    )}
                    {!t.company && !t.deal && "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/tasks/${t.id}/edit`)}
                        className="text-xs text-sf-weak hover:text-primary-600 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="text-xs text-sf-weak hover:text-danger px-2 py-1 rounded hover:bg-danger-light transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="タスクの削除"
        message="このタスクを削除しますか？"
        loading={deleting}
      />
    </div>
  );
}

export default function TasksPage() {
  return <Suspense><TasksInner /></Suspense>;
}
