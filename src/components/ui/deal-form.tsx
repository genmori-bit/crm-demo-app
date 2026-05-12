"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dealSchema, type DealFormData } from "@/lib/validations/deal";
import { DEAL_STAGE_LABELS, type DealStage } from "@/types";
import { api } from "@/lib/api-client";

interface Company { id: string; companyName: string }
interface Contact { id: string; fullName: string; companyId: string }

interface DealFormProps {
  defaultValues?: Partial<DealFormData>;
  onSubmit: (data: DealFormData) => Promise<void>;
  submitLabel: string;
  preselectedCompanyId?: string;
}

export function DealForm({ defaultValues, onSubmit, submitLabel, preselectedCompanyId }: DealFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: "lead",
      amount: 0,
      probability: 0,
      companyId: preselectedCompanyId ?? "",
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
    } else {
      setContacts([]);
    }
  }, [selectedCompanyId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input id="dealName" label="商談名 *" placeholder="〇〇システム導入" error={errors.dealName?.message} {...register("dealName")} />
      <div className="grid grid-cols-2 gap-4">
        <Select id="companyId" label="会社 *" error={errors.companyId?.message} {...register("companyId")}>
          <option value="">選択してください</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </Select>
        <Select id="contactId" label="担当者" {...register("contactId")}>
          <option value="">選択してください</option>
          {contacts.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select id="stage" label="ステージ" error={errors.stage?.message} {...register("stage")}>
          {(Object.keys(DEAL_STAGE_LABELS) as DealStage[]).map((s) => (
            <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>
          ))}
        </Select>
        <Input id="expectedCloseDate" label="クローズ予定日" type="date" {...register("expectedCloseDate")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="amount" label="金額 (円) *" type="number" min={0} error={errors.amount?.message} {...register("amount")} />
        <Input id="probability" label="確度 (%) *" type="number" min={0} max={100} error={errors.probability?.message} {...register("probability")} />
      </div>
      <Input id="nextAction" label="次回アクション" placeholder="次に取るべきアクションを記入" {...register("nextAction")} />
      <Textarea id="memo" label="メモ" placeholder="備考・特記事項" {...register("memo")} />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
