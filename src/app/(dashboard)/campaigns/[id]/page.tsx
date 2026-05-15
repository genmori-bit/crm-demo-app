"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { useToast } from "@/components/ui/toast";

interface Member {
  id: string;
  status: string;
  responded: boolean;
  prospect: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  contact:  { id: string; fullName: string; email: string | null } | null;
  lead:     { id: string; fullName: string; email: string | null } | null;
  company:  { id: string; companyName: string } | null;
}

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
  members: Member[];
  influences: {
    id: string;
    influenceType: string;
    revenueShare: number;
    deal: { id: string; dealName: string; amount: number | null; stage: string };
  }[];
}

interface SearchResult {
  id: string;
  name: string;
  email?: string;
  sub?: string;
  type: "contact" | "lead" | "company";
}

const STATUS_MAP: Record<string, { label: string; variant: "muted" | "success" | "info" | "danger" }> = {
  Planning:  { label: "計画中", variant: "muted" },
  Active:    { label: "実施中", variant: "success" },
  Completed: { label: "完了",   variant: "info" },
  Aborted:   { label: "中止",   variant: "danger" },
};

const MEMBER_STATUS_OPTIONS = ["SENT", "OPENED", "CLICKED", "RESPONDED", "CONVERTED", "WON", "UNSUBSCRIBED"];
const MEMBER_STATUS_LABELS: Record<string, string> = {
  SENT: "送信済", OPENED: "開封", CLICKED: "クリック",
  RESPONDED: "反応あり", CONVERTED: "転換", WON: "受注", UNSUBSCRIBED: "配信停止",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2 border-b border-sf-border/60 last:border-0">
      <dt className="text-xs text-sf-weak w-28 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-sf-text flex-1">{children || "—"}</dd>
    </div>
  );
}

// ── Member Add Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  campaignId,
  onClose,
  onAdded,
}: {
  campaignId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const showToast = useToast();
  const [tab, setTab] = useState<"contact" | "lead" | "company">("contact");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState("SENT");

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        let url = "";
        if (tab === "contact") url = `/api/contacts?q=${encodeURIComponent(q)}&limit=10`;
        if (tab === "lead")    url = `/api/leads?q=${encodeURIComponent(q)}&limit=10`;
        if (tab === "company") url = `/api/companies?q=${encodeURIComponent(q)}&limit=10`;

        const res = await fetch(url);
        const data = await res.json();

        if (tab === "contact") {
          setResults((data.contacts ?? []).map((c: { id: string; fullName: string; email?: string; role?: string }) => ({
            id: c.id, name: c.fullName, email: c.email, sub: c.role, type: "contact" as const,
          })));
        } else if (tab === "lead") {
          setResults((data.leads ?? []).map((l: { id: string; fullName: string; email?: string; status?: string }) => ({
            id: l.id, name: l.fullName, email: l.email, sub: l.status, type: "lead" as const,
          })));
        } else {
          setResults((data.companies ?? []).map((c: { id: string; companyName: string; industry?: string }) => ({
            id: c.id, name: c.companyName, sub: c.industry, type: "company" as const,
          })));
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, tab]);

  const handleAdd = async (item: SearchResult) => {
    setAdding(item.id);
    const res = await fetch(`/api/campaigns/${campaignId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, targetId: item.id, status: memberStatus }),
    });
    setAdding(null);
    if (res.ok) {
      showToast(`${item.name} を追加しました`, "success");
      onAdded();
      setQ("");
      setResults([]);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "追加に失敗しました", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-sf shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Modal header */}
        <div className="px-5 py-4 border-b border-sf-border flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-sf-text">メンバーを追加</h2>
          <button onClick={onClose} className="text-sf-weak hover:text-sf-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-sf-border shrink-0">
          {([["contact", "コンタクト"], ["lead", "リード"], ["company", "取引先"]] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setQ(""); setResults([]); }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${tab === t ? "border-primary-500 text-primary-600" : "border-transparent text-sf-weak hover:text-sf-text"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4 shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-weak pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="search"
              placeholder={tab === "company" ? "会社名で検索..." : "名前・メールで検索..."}
              className="w-full h-9 pl-9 pr-3 text-sm border border-sf-border rounded-sf focus:outline-none focus:border-primary-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-xs text-sf-weak shrink-0">初期ステータス:</label>
            <select
              className="h-7 px-2 text-xs border border-sf-border rounded-sf focus:outline-none focus:border-primary-500"
              value={memberStatus}
              onChange={(e) => setMemberStatus(e.target.value)}
            >
              {MEMBER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{MEMBER_STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {searching && (
            <p className="text-xs text-sf-weak text-center py-4">検索中...</p>
          )}
          {!searching && q && results.length === 0 && (
            <p className="text-xs text-sf-weak text-center py-4">該当する{tab === "company" ? "取引先" : tab === "lead" ? "リード" : "コンタクト"}が見つかりません</p>
          )}
          {!searching && !q && (
            <p className="text-xs text-sf-weak text-center py-4">名前またはメールアドレスで検索してください</p>
          )}
          <div className="space-y-1">
            {results.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-sf hover:bg-sf-bg/60 group">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 text-xs font-bold">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sf-text truncate">{item.name}</p>
                  <p className="text-xs text-sf-weak truncate">{item.email ?? item.sub ?? ""}</p>
                </div>
                <Button
                  size="xs"
                  onClick={() => handleAdd(item)}
                  disabled={adding === item.id}
                >
                  {adding === item.id ? "追加中..." : "追加"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sf-border shrink-0 flex justify-end">
          <Button variant="neutral" onClick={onClose}>閉じる</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((data) => { setCampaign(data); setLoading(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteMember = async (memberId: string) => {
    await fetch(`/api/campaigns/${id}/members/${memberId}`, { method: "DELETE" });
    showToast("メンバーを削除しました", "success");
    load();
  };

  const handleToggleResponded = async (member: Member) => {
    await fetch(`/api/campaigns/${id}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responded: !member.responded }),
    });
    load();
  };

  if (loading) return <PageLoading />;
  if (!campaign) return <div className="p-6 text-sf-weak">見つかりません</div>;

  const statusInfo = STATUS_MAP[campaign.status];
  const totalMembers = campaign.members.length;
  const respondedCount = campaign.members.filter((m) => m.responded).length;
  const responseRate = totalMembers > 0 ? Math.round((respondedCount / totalMembers) * 100) : 0;
  const wonCount = campaign.members.filter((m) => m.status === "WON" || m.status === "Won").length;

  return (
    <div className="flex flex-col min-h-screen">
      {showAddModal && (
        <AddMemberModal
          campaignId={id}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); load(); }}
        />
      )}

      {/* Page header */}
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-sf-weak mb-2">
          <Link href="/campaigns" className="hover:text-primary-600 hover:underline">キャンペーン</Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text font-medium truncate">{campaign.name}</span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sf bg-primary-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-sf-text">{campaign.name}</h1>
                {statusInfo && <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>}
                {campaign.type && <Badge variant="muted">{campaign.type}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="neutral" onClick={() => router.push(`/campaigns/${id}/edit`)}>
              編集
            </Button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="p-5 border-b border-sf-border bg-sf-bg/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="メンバー" value={totalMembers.toLocaleString()} accent="primary"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <KpiCard label="レスポンス数" value={respondedCount.toLocaleString()} accent="primary"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <KpiCard label="レスポンス率" value={`${responseRate}%`} accent={responseRate >= 50 ? "success" : responseRate >= 20 ? "warning" : "default"}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <KpiCard label="受注" value={wonCount.toLocaleString()} accent="success"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-5 items-start">
        <div className="col-span-2 space-y-5">
          {/* Basic info */}
          <LightningCard>
            <LightningCardHeader title="基本情報"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <LightningCardBody>
              <dl className="divide-y divide-sf-border/60">
                <FieldRow label="タイプ">{campaign.type}</FieldRow>
                <FieldRow label="ステータス">
                  {statusInfo ? <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge> : campaign.status}
                </FieldRow>
                <FieldRow label="開始日">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("ja-JP") : null}</FieldRow>
                <FieldRow label="終了日">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("ja-JP") : null}</FieldRow>
                <FieldRow label="予算">
                  {campaign.budget != null ? <span className="font-semibold tabular-nums">¥{campaign.budget.toLocaleString()}</span> : null}
                </FieldRow>
                <FieldRow label="実費">
                  {campaign.actualCost != null ? <span className="tabular-nums">¥{campaign.actualCost.toLocaleString()}</span> : null}
                </FieldRow>
                {campaign.description && <FieldRow label="説明">{campaign.description}</FieldRow>}
              </dl>
            </LightningCardBody>
          </LightningCard>

          {/* Members */}
          <LightningCard>
            <LightningCardHeader
              title="メンバー"
              count={campaign.members.length}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              action={
                <Button size="xs" variant="neutral" onClick={() => setShowAddModal(true)}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  メンバーを追加
                </Button>
              }
            />
            {campaign.members.length === 0 ? (
              <EmptyState
                compact
                title="メンバーがいません"
                description="コンタクト・リード・取引先を追加してください"
                action={<Button size="xs" onClick={() => setShowAddModal(true)}>メンバーを追加</Button>}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" role="grid">
                  <thead>
                    <tr className="border-b border-sf-border bg-sf-bg/60">
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">名前</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">種別</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">ステータス</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">レスポンス</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.members.map((m) => {
                      const person = m.contact ?? m.lead;
                      const name = person?.fullName ?? m.company?.companyName ?? m.prospect?.email ?? "—";
                      const email = person?.email ?? "";
                      const type = m.contact ? "コンタクト" : m.lead ? "リード" : m.company ? "取引先" : "MAリード";
                      const href = m.contact
                        ? `/contacts/${m.contact.id}`
                        : m.lead
                          ? `/leads/${m.lead.id}`
                          : m.company
                            ? `/companies/${m.company.id}`
                            : `/ma/leads/${m.prospect?.id}`;
                      return (
                        <tr key={m.id} className="border-b border-sf-border/60 last:border-0 hover:bg-sf-bg/50 group">
                          <td className="px-4 py-2.5">
                            <Link href={href} className="text-primary-600 hover:underline font-medium">{name}</Link>
                            {email && <p className="text-sf-weak mt-0.5">{email}</p>}
                          </td>
                          <td className="px-4 py-2.5 text-sf-weak">{type}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="muted">{MEMBER_STATUS_LABELS[m.status] ?? m.status}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => handleToggleResponded(m)}
                              className={`flex items-center gap-1 text-xs font-medium transition-colors ${m.responded ? "text-success hover:text-success/70" : "text-sf-weak hover:text-sf-text"}`}
                              title="クリックで切り替え"
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${m.responded ? "border-success bg-success" : "border-sf-border"}`}>
                                {m.responded && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                              </div>
                              {m.responded ? "応答あり" : "未応答"}
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => handleDeleteMember(m.id)}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-sf-weak hover:text-danger hover:bg-danger-light transition-all"
                              title="削除"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </LightningCard>

          {/* Influenced deals */}
          {campaign.influences.length > 0 && (
            <LightningCard>
              <LightningCardHeader title="影響した商談" count={campaign.influences.length}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-xs" role="grid">
                  <thead>
                    <tr className="border-b border-sf-border bg-sf-bg/60">
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">商談名</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">ステージ</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">金額</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-sf-weak uppercase tracking-wider">影響タイプ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.influences.map((i) => (
                      <tr key={i.id} className="border-b border-sf-border/60 last:border-0 hover:bg-sf-bg/50">
                        <td className="px-4 py-2.5">
                          <Link href={`/deals/${i.deal.id}`} className="text-primary-600 hover:underline font-medium">{i.deal.dealName}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-sf-weak">{i.deal.stage}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums text-sf-text">
                          {i.deal.amount ? `¥${i.deal.amount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-sf-weak">{i.influenceType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </LightningCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {campaign.parentCampaign && (
            <LightningCard>
              <LightningCardHeader title="親キャンペーン" />
              <LightningCardBody>
                <Link href={`/campaigns/${campaign.parentCampaign.id}`} className="text-sm text-primary-600 hover:underline font-medium">
                  {campaign.parentCampaign.name}
                </Link>
              </LightningCardBody>
            </LightningCard>
          )}

          {campaign.childCampaigns.length > 0 && (
            <LightningCard>
              <LightningCardHeader title="子キャンペーン" count={campaign.childCampaigns.length} />
              <LightningCardBody>
                <div className="space-y-2">
                  {campaign.childCampaigns.map((c) => {
                    const s = STATUS_MAP[c.status];
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <Link href={`/campaigns/${c.id}`} className="text-sm text-primary-600 hover:underline truncate">{c.name}</Link>
                        {s && <Badge variant={s.variant}>{s.label}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </LightningCardBody>
            </LightningCard>
          )}

          {/* Quick add button in sidebar */}
          <LightningCard>
            <LightningCardBody>
              <Button className="w-full" onClick={() => setShowAddModal(true)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                メンバーを追加
              </Button>
            </LightningCardBody>
          </LightningCard>
        </div>
      </div>
    </div>
  );
}
