"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Campaign {
  id: string;
  name: string;
  type: string | null;
  status: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  actualCost: number | null;

  parentCampaign: { id: string; name: string } | null;
  childCampaigns: { id: string; name: string; status: string }[];
  members: {
    id: string;
    status: string;
    responded: boolean;
    prospect: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
    contact: { id: string; fullName: string; email: string | null } | null;
    lead: { id: string; fullName: string; email: string | null } | null;
  }[];
  influences: {
    id: string;
    influenceType: string;
    revenueShare: number;
    deal: { id: string; dealName: string; amount: number | null; stage: string };
  }[];
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => { setCampaign(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!campaign) return <div className="p-6 text-sf-weak">見つかりません</div>;

  const totalMembers = campaign.members.length;
  const respondedCount = campaign.members.filter((m) => m.responded).length;
  const responseRate = totalMembers > 0 ? Math.round((respondedCount / totalMembers) * 100) : 0;
  const wonCount = campaign.members.filter((m) => m.status === "Won").length;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/campaigns" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-2xs text-sf-weak">キャンペーン</p>
          <h1 className="text-xl font-bold text-sf-text">{campaign.name}</h1>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-sf-bg border border-sf-border text-sf-weak">{campaign.status}</span>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "メンバー", value: totalMembers.toLocaleString() },
            { label: "レスポンス数", value: respondedCount.toLocaleString() },
            { label: "レスポンス率", value: `${responseRate}%` },
            { label: "成約商談", value: wonCount.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4 text-center">
              <p className="text-2xl font-bold text-sf-text">{s.value}</p>
              <p className="text-xs text-sf-weak mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Info */}
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
              <h2 className="text-sm font-semibold text-sf-text mb-4">基本情報</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  ["タイプ", campaign.type],
                  ["ステータス", campaign.status],
                  ["開始日", campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("ja-JP") : null],
                  ["終了日", campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("ja-JP") : null],
                  ["予算", campaign.budget != null ? `¥${campaign.budget.toLocaleString()}` : null],
                  ["実費", campaign.actualCost != null ? `¥${campaign.actualCost.toLocaleString()}` : null],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-2xs text-sf-weak">{label}</p>
                    <p className="text-sf-text">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
              {campaign.description && (
                <div className="mt-4">
                  <p className="text-2xs text-sf-weak mb-1">説明</p>
                  <p className="text-sm text-sf-text">{campaign.description}</p>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
              <h2 className="text-sm font-semibold text-sf-text mb-4">メンバー ({campaign.members.length})</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sf-border">
                    <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">名前</th>
                    <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">種別</th>
                    <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">ステータス</th>
                    <th className="text-left pb-2 text-2xs font-semibold text-sf-weak">レスポンス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {campaign.members.map((m) => {
                    const name = m.contact?.fullName ?? m.lead?.fullName ?? m.prospect?.email ?? "—";
                    const type = m.contact ? "コンタクト" : m.lead ? "リード" : "MAリード";
                    const href = m.contact ? `/contacts/${m.contact.id}` : m.lead ? `/leads/${m.lead.id}` : `/ma/leads/${m.prospect?.id}`;
                    return (
                      <tr key={m.id}>
                        <td className="py-2">
                          <Link href={href} className="text-primary-600 hover:underline">{name}</Link>
                        </td>
                        <td className="py-2 text-sf-weak text-2xs">{type}</td>
                        <td className="py-2 text-sf-weak">{m.status}</td>
                        <td className="py-2">{m.responded ? "✓" : "—"}</td>
                      </tr>
                    );
                  })}
                  {campaign.members.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-xs text-sf-weak">メンバーがいません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            {campaign.parentCampaign && (
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h3 className="text-xs font-semibold text-sf-weak mb-2">親キャンペーン</h3>
                <Link href={`/campaigns/${campaign.parentCampaign.id}`} className="text-sm text-primary-600 hover:underline">
                  {campaign.parentCampaign.name}
                </Link>
              </div>
            )}
            {campaign.childCampaigns.length > 0 && (
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h3 className="text-xs font-semibold text-sf-weak mb-2">子キャンペーン</h3>
                <div className="space-y-1">
                  {campaign.childCampaigns.map((c) => (
                    <Link key={c.id} href={`/campaigns/${c.id}`} className="block text-sm text-primary-600 hover:underline">{c.name}</Link>
                  ))}
                </div>
              </div>
            )}
            {campaign.influences.length > 0 && (
              <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
                <h3 className="text-xs font-semibold text-sf-weak mb-2">影響した商談</h3>
                <div className="space-y-2">
                  {campaign.influences.map((i) => (
                    <div key={i.id}>
                      <Link href={`/deals/${i.deal.id}`} className="text-sm text-primary-600 hover:underline">{i.deal.dealName}</Link>
                      <p className="text-2xs text-sf-weak">{i.deal.stage} {i.deal.amount ? `¥${i.deal.amount.toLocaleString()}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
