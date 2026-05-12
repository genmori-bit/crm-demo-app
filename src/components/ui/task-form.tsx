"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskSchema, type TaskFormData } from "@/lib/validations/task";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, type TaskPriority, type TaskStatus } from "@/types";
import { api } from "@/lib/api-client";

interface Company { id: string; companyName: string }
interface Deal { id: string; dealName: string }

interface TaskFormProps {
  defaultValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  submitLabel: string;
  preselected?: { companyId?: string; dealId?: string };
}

export function TaskForm({ defaultValues, onSubmit, submitLabel, preselected }: TaskFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: "medium",
      status: "todo",
      companyId: preselected?.companyId ?? "",
      dealId: preselected?.dealId ?? "",
      ...defaultValues,
    },
  });

  const selectedCompanyId = watch("companyId");

  useEffect(() => {
    api.get<Company[]>("/api/companies").then(setCompanies);
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      api.get<Deal[]>(`/api/deals?companyId=${selectedCompanyId}`).then(setDeals);
    } else {
      setDeals([]);
    }
  }, [selectedCompanyId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input id="title" label="タイトル *" placeholder="タスクのタイトル" error={errors.title?.message} {...register("title")} />
      <Textarea id="description" label="詳細" placeholder="タスクの詳細を記入" {...register("description")} />
      <div className="grid grid-cols-3 gap-4">
        <Select id="priority" label="優先度" {...register("priority")}>
          {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
        <Select id="status" label="ステータス" {...register("status")}>
          {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Input id="dueDate" label="期限日" type="date" {...register("dueDate")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select id="companyId" label="会社" {...register("companyId")}>
          <option value="">選択してください</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </Select>
        <Select id="dealId" label="商談" {...register("dealId")}>
          <option value="">選択してください</option>
          {deals.map((d) => <option key={d.id} value={d.id}>{d.dealName}</option>)}
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
