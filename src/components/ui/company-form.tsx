"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { companySchema, type CompanyFormData } from "@/lib/validations/company";
import { COMPANY_STATUS_LABELS, type CompanyStatus } from "@/types";

const INDUSTRIES = ["IT・ソフトウェア", "商社・卸売", "医療・ヘルスケア", "飲食・食品", "製造・メーカー", "金融・保険", "不動産", "サービス", "その他"];
const EMPLOYEE_SIZES = ["1-10名", "10-50名", "50-100名", "100-500名", "500-1000名", "1000名以上"];

interface CompanyFormProps {
  defaultValues?: Partial<CompanyFormData>;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  submitLabel: string;
}

export function CompanyForm({ defaultValues, onSubmit, submitLabel }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { status: "prospect", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        id="companyName"
        label="会社名 *"
        placeholder="株式会社〇〇"
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select id="status" label="ステータス" error={errors.status?.message} {...register("status")}>
          {(Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]).map((s) => (
            <option key={s} value={s}>{COMPANY_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select id="industry" label="業界" {...register("industry")}>
          <option value="">選択してください</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="website" label="Webサイト" placeholder="https://example.com" error={errors.website?.message} {...register("website")} />
        <Select id="employeeSize" label="従業員規模" {...register("employeeSize")}>
          <option value="">選択してください</option>
          {EMPLOYEE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <Input id="ownerName" label="担当者名" placeholder="田中 太郎" {...register("ownerName")} />
      <Textarea id="memo" label="メモ" placeholder="備考・特記事項を記入" {...register("memo")} />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
