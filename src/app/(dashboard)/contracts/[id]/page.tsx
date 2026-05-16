"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, formatAmount } from "@/lib/utils";
import { ObjectIcon } from "@/components/ui/object-icon";

interface Contract {
  id: string;
  name: string;
  contractNumber: string;
  status: string;
  startDate: string;
  endDate: string | null;
  contractValue: number;
  createdAt: string;
  company: { id: string; companyName: string };
  deal: { id: string; dealName: string } | null;
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: number; orderDate: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き", ACTIVE: "有効", EXPIRED: "期限切れ", TERMINATED: "解約",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-sf-bg text-sf-weak border-sf-border",
  ACTIVE: "bg-success-light text-success border-success-border",
  EXPIRED: "bg-warning-light text-warning border-warning-border",
  TERMINATED: "bg-danger-light text-danger border-danger-border",
};
const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き", CONFIRMED: "確定", SHIPPED: "出荷済み", DELIVERED: "納品済み", CANCELLED: "キャンセル",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status] ?? "bg-sf-bg text-sf-weak border-sf-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/contracts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setContract)
      .catch(() => setContract(null));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      showToast("契約を削除しました");
      router.push(contract?.company ? `/companies/${contract.company.id}` : "/companies");
    } else {
      showToast("削除に失敗しました", "error");
    }
  };

  if (!contract) return <PageLoading />;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border">
        <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 text-xs text-sf-weak">
          <Link href={`/companies/${contract.company.id}`} className="hover:text-primary-500 hover:underline">
            {contract.company.companyName}
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text truncate max-w-xs">{contract.name}</span>
        </div>

        <div className="px-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ObjectIcon objectType="Contract" size="sm" />
            <div>
              <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">契約</p>
              <h1 className="text-xl font-bold text-sf-text leading-tight">{contract.name}</h1>
              <p className="text-xs text-sf-weak font-mono mt-0.5">{contract.contractNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <StatusBadge status={contract.status} />
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-medium border border-danger-border text-danger hover:bg-danger-light transition-colors"
            >
              削除
            </button>
          </div>
        </div>

        {/* Key fields strip */}
        <div className="px-6 py-3 bg-sf-bg/50 flex flex-wrap gap-x-8 gap-y-2 border-t border-sf-border">
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">契約金額</dt>
            <dd className="text-xl font-bold text-sf-text">{formatAmount(contract.contractValue)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">開始日</dt>
            <dd className="text-sm font-semibold text-sf-text">{formatDate(contract.startDate)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">終了日</dt>
            <dd className="text-sm font-semibold text-sf-text">{formatDate(contract.endDate) || "—"}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">取引先</dt>
            <dd className="text-sm font-semibold">
              <Link href={`/companies/${contract.company.id}`} className="text-primary-500 hover:underline">
                {contract.company.companyName}
              </Link>
            </dd>
          </div>
          {contract.deal && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">商談</dt>
              <dd className="text-sm font-semibold">
                <Link href={`/deals/${contract.deal.id}`} className="text-primary-500 hover:underline">
                  {contract.deal.dealName}
                </Link>
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-3xl">
        <LightningCard>
          <LightningCardHeader
            title={`注文 (${contract.orders.length})`}
            action={
              <Link
                href={`/orders/new?companyId=${contract.company.id}&contractId=${id}`}
                className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                追加
              </Link>
            }
          />
          {contract.orders.length === 0 ? (
            <LightningCardBody>
              <p className="text-sm text-sf-weak text-center py-4">注文がありません</p>
            </LightningCardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-sf-bg border-b border-sf-border">
                    {["注文番号", "ステータス", "注文日", "金額"].map((h) => (
                      <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {contract.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-sf-bg transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/orders/${o.id}`} className="text-sm font-mono text-primary-500 hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak">{ORDER_STATUS_LABEL[o.status] ?? o.status}</td>
                      <td className="px-4 py-2.5 text-sm text-sf-weak">{formatDate(o.orderDate)}</td>
                      <td className="px-4 py-2.5 text-sm tabular-nums">{formatAmount(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LightningCard>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="契約の削除"
        message={`「${contract.name}」を削除しますか？`}
        loading={deleting}
      />
    </div>
  );
}
