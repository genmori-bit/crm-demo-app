"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { ContactForm } from "@/components/ui/contact-form";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { ContactFormData } from "@/lib/validations/contact";

function NewContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const preselectedCompanyId = searchParams.get("companyId") ?? undefined;

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const contact = await api.post<{ id: string }>("/api/contacts", data);
      showToast("担当者を作成しました");
      router.push(`/contacts/${contact.id}`);
    } catch {
      showToast("作成に失敗しました", "error");
    }
  };

  return <ContactForm onSubmit={handleSubmit} submitLabel="作成する" preselectedCompanyId={preselectedCompanyId} />;
}

export default function NewContactPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">担当者 / 新規作成</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <Suspense>
            <NewContactForm />
          </Suspense>
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
