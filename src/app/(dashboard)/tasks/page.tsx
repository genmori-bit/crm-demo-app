"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LightningCard } from "@/components/ui/lightning-card";
import { ListViewToolbar } from "@/components/ui/list-view-toolbar";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/ui/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatDate, isOverdue } from "@/lib/utils";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/types";

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

export default function TasksPage() {
  const router = useRouter();
  const showToast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (query) params.set("q", query);
    const data = await api.get<Task[]>(`/api/tasks?${params}`);
    setTasks(data);
    setLoading(false);
  }, [statusFilter, query]);

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">タスク</h1>
            <p className="text-xs text-sf-weak">{tasks.length}件</p>
          </div>
        </div>
        <Button onClick={() => router.push("/tasks/new")}>
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Button>
      </div>

      <LightningCard>
        <ListViewToolbar
          total={loading ? undefined : tasks.length}
          objectLabel="タスク"
          searchValue={query}
          onSearchChange={setQuery}
          onRefresh={load}
          filters={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs w-40">
              <option value="">すべてのステータス</option>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
              ))}
            </Select>
          }
          actions={
            <Button size="sm" onClick={() => router.push("/tasks/new")}>
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規
            </Button>
          }
        />

        {loading ? (
          <PageLoading />
        ) : tasks.length === 0 ? (
          <EmptyState title="タスクが見つかりません" action={<Button onClick={() => router.push("/tasks/new")}>新規作成</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sf-border bg-sf-bg">
                  <th className="px-4 py-2.5 w-8" />
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">タイトル</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">優先度</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">ステータス</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">期限</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-sf-weak">関連</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sf-border">
                {tasks.map((t) => {
                  const overdue = t.dueDate && isOverdue(t.dueDate) && t.status !== "done";
                  return (
                    <tr key={t.id} className={`transition-colors group ${overdue ? "bg-danger-light/30" : "hover:bg-sf-bg"}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleDone(t)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${t.status === "done" ? "border-success bg-success" : "border-sf-border hover:border-primary-400"}`}
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
                        <p className={`font-medium ${t.status === "done" ? "line-through text-sf-weak" : "text-sf-text"}`}>{t.title}</p>
                        {t.description && <p className="text-xs text-sf-weak truncate max-w-xs mt-0.5">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3"><TaskPriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><TaskStatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${overdue ? "text-danger font-medium" : "text-sf-weak"}`}>
                          {formatDate(t.dueDate)}
                          {overdue && <span className="ml-1">!</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-sf-weak space-y-0.5">
                        {t.company && (
                          <div>
                            <Link href={`/companies/${t.company.id}`} className="hover:text-primary-500 hover:underline">{t.company.companyName}</Link>
                          </div>
                        )}
                        {t.deal && (
                          <div>
                            <Link href={`/deals/${t.deal.id}`} className="hover:text-primary-500 hover:underline">{t.deal.dealName}</Link>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/tasks/${t.id}/edit`)}>編集</Button>
                          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setDeleteId(t.id)}>削除</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LightningCard>

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
