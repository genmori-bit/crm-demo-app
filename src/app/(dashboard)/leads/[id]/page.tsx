"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Lead {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  companyName: string | null;
  title: string | null;
  industry: string | null;
  website: string | null;
  source: string | null;
  status: string;
  rating: string;
  score: number | null;
  convertedAt: string | null;
  convertedAccountId: string | null;
  convertedContactId: string | null;
  convertedDealId: string | null;
  disqualifiedReason: string | null;
  createdAt: string;
  company: { id: string; companyName: string } | null;
  prospect: { id: string; email: string } | null;
  activities: { id: string; type: string; subject: string; activityDate: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "新規", WORKING: "対応中", NURTURING: "育成中", CONVERTED: "変換済み", DISQUALIFIED: "失格",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    createCompany: true, companyName: "", createDeal: false, dealName: "", dealAmount: "", dealStage: "Prospecting",
  });

  const load = () => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => { setLead(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (lead && !convertForm.companyName) {
      setConvertForm((f) => ({ ...f, companyName: lead.companyName ?? lead.fullName }));
    }
  }, [lead]);

  const convert = async () => {
    setConverting(true);
    const res = await fetch("/api/leads/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: id,
        createCompany: convertForm.createCompany,
        companyName: convertForm.companyName,
        createContact: true,
        createDeal: convertForm.createDeal,
        dealName: convertForm.dealName || undefined,
        dealAmount: convertForm.dealAmount ? parseFloat(convertForm.dealAmount) : undefined,
        dealStage: convertForm.dealStage,
      }),
    });
    setConverting(false);
    if (res.ok) {
      showToast("リードを変換しました", "success");
      setConvertOpen(false);
      load();
    } else {
      const err = await res.json();
      showToast(err.error ?? "変換に失敗しました", "error");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!lead) return <div className="p-6 text-sf-weak">見つかりません</div>;

  const isConverted = !!lead.convertedAt;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link href="/leads" className="text-sf-weak hover:text-sf-text">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <p className="text-2xs text-sf-weak">リード</p>
          <h1 className="text-xl font-bold text-sf-text">{lead.fullName}</h1>
        </div>
        {!isConverted && (
          <button
            onClick={() => setConvertOpen(true)}
            className="bg-success text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90"
          >
            変換
          </button>
        )}
        {isConverted && (
          <span className="text-xs text-success font-medium bg-green-50 border border-green-200 px-3 py-1 rounded-full">変換済み</span>
        )}
      </div>

      <div className="flex-1 p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
            <h2 className="text-sm font-semibold text-sf-text mb-4">基本情報</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ["氏名", lead.fullName],
                ["メール", lead.email],
                ["電話", lead.phone],
                ["携帯", lead.mobilePhone],
                ["会社名", lead.companyName],
                ["役職", lead.title],
                ["業種", lead.industry],
                ["Webサイト", lead.website],
                ["ソース", lead.source],
                ["ステータス", STATUS_LABELS[lead.status] ?? lead.status],
                ["評価", lead.rating],
                ["スコア", lead.score != null ? String(lead.score) : null],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-2xs text-sf-weak">{label}</p>
                  <p className="text-sf-text">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {isConverted && (
            <div className="bg-green-50 border border-green-200 rounded-sf p-5">
              <h2 className="text-sm font-semibold text-green-800 mb-3">変換先レコード</h2>
              <div className="flex gap-4 flex-wrap text-sm">
                {lead.convertedAccountId && (
                  <Link href={`/companies/${lead.convertedAccountId}`} className="text-primary-600 hover:underline">会社 →</Link>
                )}
                {lead.convertedContactId && (
                  <Link href={`/contacts/${lead.convertedContactId}`} className="text-primary-600 hover:underline">コンタクト →</Link>
                )}
                {lead.convertedDealId && (
                  <Link href={`/deals/${lead.convertedDealId}`} className="text-primary-600 hover:underline">商談 →</Link>
                )}
              </div>
            </div>
          )}

          {lead.activities.length > 0 && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-5">
              <h2 className="text-sm font-semibold text-sf-text mb-4">活動履歴</h2>
              <div className="space-y-2">
                {lead.activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm py-2 border-b border-sf-border last:border-0">
                    <span className="text-2xs text-sf-weak w-24 shrink-0">{new Date(a.activityDate).toLocaleDateString("ja-JP")}</span>
                    <span className="text-sf-weak text-2xs">{a.type}</span>
                    <span className="text-sf-text">{a.subject}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {lead.company && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
              <h3 className="text-xs font-semibold text-sf-weak mb-2">リンク企業</h3>
              <Link href={`/companies/${lead.company.id}`} className="text-sm text-primary-600 hover:underline">{lead.company.companyName}</Link>
            </div>
          )}
          {lead.prospect && (
            <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-4">
              <h3 className="text-xs font-semibold text-sf-weak mb-2">MAリード</h3>
              <Link href={`/ma/leads/${lead.prospect.id}`} className="text-sm text-primary-600 hover:underline">{lead.prospect.email}</Link>
            </div>
          )}
        </div>
      </div>

      {convertOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-sf shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-sf-text mb-4">リードを変換</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={convertForm.createCompany} onChange={(e) => setConvertForm(f => ({ ...f, createCompany: e.target.checked }))} />
                新規会社を作成
              </label>
              {convertForm.createCompany && (
                <label className="block">
                  <span className="text-xs font-medium text-sf-text">会社名</span>
                  <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={convertForm.companyName} onChange={(e) => setConvertForm(f => ({ ...f, companyName: e.target.value }))} />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={convertForm.createDeal} onChange={(e) => setConvertForm(f => ({ ...f, createDeal: e.target.checked }))} />
                商談を作成
              </label>
              {convertForm.createDeal && (
                <div className="space-y-3 pl-6">
                  <label className="block">
                    <span className="text-xs font-medium text-sf-text">商談名</span>
                    <input className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={convertForm.dealName} onChange={(e) => setConvertForm(f => ({ ...f, dealName: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-sf-text">金額</span>
                    <input type="number" className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm" value={convertForm.dealAmount} onChange={(e) => setConvertForm(f => ({ ...f, dealAmount: e.target.value }))} />
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={convert} disabled={converting} className="bg-success text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {converting ? "変換中..." : "変換"}
              </button>
              <button onClick={() => setConvertOpen(false)} className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
