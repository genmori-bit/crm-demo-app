"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LightningCard, LightningCardHeader } from "@/components/ui/lightning-card";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

interface Activity {
  id: string;
  type: string;
  subject: string;
  body?: string | null;
  activityDate: string;
  company: { id: string; companyName: string } | null;
  contact: { id: string; fullName: string } | null;
  deal: { id: string; dealName: string } | null;
}

export default function ActivitiesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<Activity[]>("/api/activities");
    setActivities(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/activities/${deleteId}`);
      showToast("活動履歴を削除しました");
      setDeleteId(null);
      load();
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sf-text">活動履歴</h1>
            <p className="text-xs text-sf-weak">{activities.length}件</p>
          </div>
        </div>
        <Button onClick={() => router.push("/activities/new")}>
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規追加
        </Button>
      </div>

      <LightningCard>
        <LightningCardHeader
          title={`活動履歴 (${activities.length})`}
          action={
            <Button size="sm" onClick={() => router.push("/activities/new")}>
              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規
            </Button>
          }
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        {loading ? (
          <PageLoading />
        ) : activities.length === 0 ? (
          <EmptyState
            title="活動履歴がありません"
            action={<Button onClick={() => router.push("/activities/new")}>新規追加</Button>}
          />
        ) : (
          <ActivityTimeline activities={activities} />
        )}
      </LightningCard>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="活動履歴の削除"
        message="この活動履歴を削除しますか？"
        loading={deleting}
      />
    </div>
  );
}
