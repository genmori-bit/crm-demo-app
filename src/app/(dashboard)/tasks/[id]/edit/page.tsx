"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { TaskForm } from "@/components/ui/task-form";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { TaskFormData } from "@/lib/validations/task";

interface Task extends Omit<TaskFormData, "dueDate"> {
  id: string;
  title: string;
  dueDate: string | null;
}

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    api.get<Task>(`/api/tasks/${id}`).then((t) => {
      setTask({
        ...t,
        companyId: t.companyId ?? "",
        dealId: t.dealId ?? "",
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "",
      });
    });
  }, [id]);

  const handleSubmit = async (data: TaskFormData) => {
    try {
      await api.patch(`/api/tasks/${id}`, data);
      showToast("タスクを更新しました");
      router.push("/tasks");
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  if (!task) return <PageLoading />;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">{task.title} / 編集</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <TaskForm
            defaultValues={{ ...task, dueDate: task.dueDate ?? undefined }}
            onSubmit={handleSubmit}
            submitLabel="更新する"
          />
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
