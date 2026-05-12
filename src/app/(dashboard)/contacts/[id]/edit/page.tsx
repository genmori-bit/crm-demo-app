"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardBody } from "@/components/ui/lightning-card";
import { ContactForm } from "@/components/ui/contact-form";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { ContactFormData } from "@/lib/validations/contact";

interface Contact extends ContactFormData { id: string; fullName: string }

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    api.get<Contact>(`/api/contacts/${id}`).then(setContact);
  }, [id]);

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await api.patch(`/api/contacts/${id}`, data);
      showToast("担当者を更新しました");
      router.push(`/contacts/${id}`);
    } catch {
      showToast("更新に失敗しました", "error");
    }
  };

  if (!contact) return <PageLoading />;

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-sf-text">{contact.fullName} / 編集</h1>
        <Button variant="secondary" onClick={() => router.back()}>キャンセル</Button>
      </div>
      <LightningCard>
        <LightningCardBody className="py-5">
          <ContactForm defaultValues={contact} onSubmit={handleSubmit} submitLabel="更新する" />
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
