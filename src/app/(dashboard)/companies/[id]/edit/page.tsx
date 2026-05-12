"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { CompanyForm } from "@/components/ui/company-form";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { CompanyFormData } from "@/lib/validations/company";

interface Company extends CompanyFormData {
  id: string;
}

export default function EditCompanyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    api.get<Company>(`/api/companies/${id}`).then(setCompany);
  }, [id]);

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      await api.patch(`/api/companies/${id}`, data);
      showToast("顧客企業を更新しました");
      router.push(`/companies/${id}`);
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  if (!company) return <PageLoading />;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">{company.companyName} / 編集</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <CompanyForm defaultValues={company} onSubmit={handleSubmit} submitLabel="更新する" />
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
