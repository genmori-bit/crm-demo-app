"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { api } from "@/lib/api-client";

interface Company { id: string; companyName: string }

interface ContactFormProps {
  defaultValues?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  submitLabel: string;
  preselectedCompanyId?: string;
}

export function ContactForm({ defaultValues, onSubmit, submitLabel, preselectedCompanyId }: ContactFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    api.get<Company[]>("/api/companies").then(setCompanies);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { isPrimary: false, companyId: preselectedCompanyId ?? "", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Select id="companyId" label="会社 *" error={errors.companyId?.message} {...register("companyId")}>
        <option value="">選択してください</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.companyName}</option>
        ))}
      </Select>
      <Input id="fullName" label="氏名 *" placeholder="田中 太郎" error={errors.fullName?.message} {...register("fullName")} />
      <div className="grid grid-cols-2 gap-4">
        <Input id="email" label="メールアドレス" type="email" placeholder="tanaka@example.com" error={errors.email?.message} {...register("email")} />
        <Input id="phone" label="電話番号" placeholder="03-1234-5678" {...register("phone")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="department" label="部署" placeholder="営業部" {...register("department")} />
        <Input id="title" label="役職" placeholder="部長" {...register("title")} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isPrimary" {...register("isPrimary")} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
        <label htmlFor="isPrimary" className="text-sm text-gray-700">主要担当者として設定</label>
      </div>
      <Textarea id="memo" label="メモ" placeholder="備考・特記事項" {...register("memo")} />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
