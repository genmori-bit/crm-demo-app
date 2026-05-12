"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { DealForm } from "@/components/ui/deal-form";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { DealFormData } from "@/lib/validations/deal";

interface Deal extends Omit<DealFormData, "expectedCloseDate"> {
  id: string;
  dealName: string;
  expectedCloseDate: string | null;
}

export default function EditDealPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    api.get<Deal>(`/api/deals/${id}`).then((d) => {
      setDeal({
        ...d,
        expectedCloseDate: d.expectedCloseDate
          ? new Date(d.expectedCloseDate).toISOString().split("T")[0]
          : "",
      });
    });
  }, [id]);

  const handleSubmit = async (data: DealFormData) => {
    try {
      await api.patch(`/api/deals/${id}`, data);
      showToast("商談を更新しました");
      router.push(`/deals/${id}`);
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  if (!deal) return <PageLoading />;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">{deal.dealName} / 編集</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <DealForm
            defaultValues={{ ...deal, expectedCloseDate: deal.expectedCloseDate ?? undefined }}
            onSubmit={handleSubmit}
            submitLabel="更新する"
          />
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
