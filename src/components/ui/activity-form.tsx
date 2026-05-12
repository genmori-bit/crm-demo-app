"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { activitySchema, type ActivityFormData } from "@/lib/validations/activity";
import { ACTIVITY_TYPE_LABELS, type ActivityType } from "@/types";
import { api } from "@/lib/api-client";

interface Company { id: string; companyName: string }
interface Contact { id: string; fullName: string }
interface Deal { id: string; dealName: string }

interface ActivityFormProps {
  defaultValues?: Partial<ActivityFormData>;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  submitLabel: string;
  preselected?: { companyId?: string; contactId?: string; dealId?: string };
}

export function ActivityForm({ defaultValues, onSubmit, submitLabel, preselected }: ActivityFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: "phone",
      activityDate: new Date().toISOString().split("T")[0],
      companyId: preselected?.companyId ?? "",
      contactId: preselected?.contactId ?? "",
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
      api.get<Contact[]>(`/api/contacts?companyId=${selectedCompanyId}`).then(setContacts);
      api.get<Deal[]>(`/api/deals?companyId=${selectedCompanyId}`).then(setDeals);
    } else {
      setContacts([]);
      setDeals([]);
    }
  }, [selectedCompanyId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Select id="type" label="種別" error={errors.type?.message} {...register("type")}>
          {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
            <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
          ))}
        </Select>
        <Input id="activityDate" label="活動日 *" type="date" error={errors.activityDate?.message} {...register("activityDate")} />
      </div>
      <Input id="subject" label="件名 *" placeholder="ミーティング・電話内容など" error={errors.subject?.message} {...register("subject")} />
      <div className="grid grid-cols-2 gap-4">
        <Select id="companyId" label="会社" {...register("companyId")}>
          <option value="">選択してください</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </Select>
        <Select id="contactId" label="担当者" {...register("contactId")}>
          <option value="">選択してください</option>
          {contacts.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </Select>
      </div>
      <Select id="dealId" label="商談" {...register("dealId")}>
        <option value="">選択してください</option>
        {deals.map((d) => <option key={d.id} value={d.id}>{d.dealName}</option>)}
      </Select>
      <Textarea id="body" label="内容" rows={5} placeholder="活動の詳細を記入" {...register("body")} />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
