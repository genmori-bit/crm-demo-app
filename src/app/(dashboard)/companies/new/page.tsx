"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { CompanyForm } from "@/components/ui/company-form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { CompanyFormData } from "@/lib/validations/company";

export default function NewCompanyPage() {
  const router = useRouter();
  const showToast = useToast();

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      const company = await api.post<{ id: string }>("/api/companies", data);
      showToast("顧客企業を作成しました");
      router.push(`/companies/${company.id}`);
    } catch {
      showToast("作成に失敗しました", "error");
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">顧客企業 / 新規作成</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <CompanyForm onSubmit={handleSubmit} submitLabel="作成する" />
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
