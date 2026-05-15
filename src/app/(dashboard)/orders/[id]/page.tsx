"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, formatAmount } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  createdAt: string;
  company: { id: string; companyName: string };
  contract: { id: string; contractNumber: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { id: string; name: string; productCode: string } | null;
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "下書き", CONFIRMED: "確定", SHIPPED: "出荷済み",
  DELIVERED: "納品済み", CANCELLED: "キャンセル",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-sf-bg text-sf-weak border-sf-border",
  CONFIRMED: "bg-info-light text-info border-info-border",
  SHIPPED: "bg-primary-50 text-primary-600 border-primary-200",
  DELIVERED: "bg-success-light text-success border-success-border",
  CANCELLED: "bg-danger-light text-danger border-danger-border",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status] ?? "bg-sf-bg text-sf-weak border-sf-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then(setOrder);
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      showToast("注文を削除しました");
      router.push(order?.company ? `/companies/${order.company.id}` : "/companies");
    } else {
      showToast("削除に失敗しました", "error");
    }
  };

  if (!order) return <PageLoading />;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-sf-surface border-b border-sf-border">
        <div className="px-6 pt-3 pb-1 flex items-center gap-1.5 text-xs text-sf-weak">
          <Link href={`/companies/${order.company.id}`} className="hover:text-primary-500 hover:underline">
            {order.company.companyName}
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sf-text truncate max-w-xs">{order.orderNumber}</span>
        </div>

        <div className="px-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sf bg-primary-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-2xs font-medium text-sf-weak uppercase tracking-wide">注文</p>
              <h1 className="text-xl font-bold text-sf-text leading-tight font-mono">{order.orderNumber}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <StatusBadge status={order.status} />
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
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">金額</dt>
            <dd className="text-xl font-bold text-sf-text">{formatAmount(order.totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">注文日</dt>
            <dd className="text-sm font-semibold text-sf-text">{formatDate(order.orderDate)}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">取引先</dt>
            <dd className="text-sm font-semibold">
              <Link href={`/companies/${order.company.id}`} className="text-primary-500 hover:underline">
                {order.company.companyName}
              </Link>
            </dd>
          </div>
          {order.contract && (
            <div>
              <dt className="text-2xs font-medium text-sf-weak uppercase tracking-wide mb-0.5">契約</dt>
              <dd className="text-sm font-semibold">
                <Link href={`/contracts/${order.contract.id}`} className="text-primary-500 hover:underline font-mono">
                  {order.contract.contractNumber}
                </Link>
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-3xl">
        <LightningCard>
          <LightningCardHeader title={`明細 (${order.items.length})`} />
          {order.items.length === 0 ? (
            <LightningCardBody>
              <p className="text-sm text-sf-weak text-center py-4">明細がありません</p>
            </LightningCardBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-sf-bg border-b border-sf-border">
                    {["商品", "数量", "単価", "小計"].map((h) => (
                      <th key={h} className="px-4 py-2 text-xs font-semibold text-sf-weak uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sf-border">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-sf-bg transition-colors">
                      <td className="px-4 py-2.5 text-sm text-sf-text">
                        {item.product ? (
                          <span>{item.product.name} <span className="text-sf-weak text-xs">({item.product.productCode})</span></span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-sm tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-sm tabular-nums">{formatAmount(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-sm font-semibold tabular-nums">{formatAmount(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-sf-border bg-sf-bg/50">
                    <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-sf-text text-right">合計</td>
                    <td className="px-4 py-2.5 text-base font-bold text-sf-text tabular-nums">{formatAmount(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </LightningCard>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="注文の削除"
        message={`注文「${order.orderNumber}」を削除しますか？`}
        loading={deleting}
      />
    </div>
  );
}
