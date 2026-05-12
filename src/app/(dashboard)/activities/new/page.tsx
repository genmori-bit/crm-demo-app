"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { ActivityForm } from "@/components/ui/activity-form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { ActivityFormData } from "@/lib/validations/activity";

function NewActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();

  const preselected = {
    companyId: searchParams.get("companyId") ?? undefined,
    contactId: searchParams.get("contactId") ?? undefined,
    dealId: searchParams.get("dealId") ?? undefined,
  };

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      await api.post("/api/activities", data);
      showToast("活動履歴を追加しました");
      router.back();
    } catch {
      showToast("追加に失敗しました", "error");
    }
  };

  return <ActivityForm onSubmit={handleSubmit} submitLabel="追加する" preselected={preselected} />;
}

export default function NewActivityPage() {
  const router = useRouter();
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">活動履歴 / 新規追加</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <Suspense>
            <NewActivityForm />
          </Suspense>
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
