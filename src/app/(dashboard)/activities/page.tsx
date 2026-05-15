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
import { cn } from "@/lib/utils";

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

const TYPE_FILTERS = [
  { id: "all",     label: "すべて",     type: "" },
  { id: "call",    label: "電話",       type: "CALL" },
  { id: "email",   label: "メール",     type: "EMAIL" },
  { id: "meeting", label: "ミーティング", type: "MEETING" },
  { id: "note",    label: "メモ",       type: "NOTE" },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const showToast = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const typeFilter = TYPE_FILTERS.find((f) => f.id === activeType)?.type ?? "";

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    const data = await api.get<Activity[]>(`/api/activities?${params}`);
    setActivities(data);
    setLoading(false);
  }, [typeFilter]);

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
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xs font-semibold text-sf-weak uppercase tracking-wide">CRM</p>
            <h1 className="text-xl font-bold text-sf-text">活動履歴</h1>
          </div>
        </div>
        <Button onClick={() => router.push("/activities/new")}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規追加
        </Button>
      </div>

      {/* Type filter tabs */}
      <div className="bg-sf-surface border-b border-sf-border px-6 overflow-x-auto">
        <nav className="flex" role="tablist" aria-label="種別フィルター">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={activeType === f.id}
              onClick={() => setActiveType(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors focus:outline-none",
                activeType === f.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-sf-weak hover:text-sf-text hover:border-sf-border"
              )}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <LightningCard>
          <LightningCardHeader
            title="活動履歴"
            count={loading ? undefined : activities.length}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            action={
              <Button size="sm" onClick={() => router.push("/activities/new")}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規
              </Button>
            }
          />
          {loading ? (
            <PageLoading />
          ) : activities.length === 0 ? (
            <EmptyState
              title="活動履歴がありません"
              description="電話・メール・ミーティングなどの活動を記録しましょう"
              action={<Button onClick={() => router.push("/activities/new")}>新規追加</Button>}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          ) : (
            <ActivityTimeline activities={activities} />
          )}
        </LightningCard>
      </div>

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
