"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Company { id: string; companyName: string; }

function genOrderNumber() {
  const now = new Date();
  const yymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${yymm}-${rand}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [form, setForm] = useState({
    companyId: searchParams.get("companyId") ?? "",
    orderNumber: genOrderNumber(),
    status: "DRAFT",
    orderDate: new Date().toISOString().slice(0, 10),
    totalAmount: "",
    memo: "",
  });

  useEffect(() => {
    fetch("/api/companies?limit=200")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.companyId) { showToast("取引先は必須です", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: form.companyId,
        orderNumber: form.orderNumber,
        status: form.status,
        orderDate: form.orderDate,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const o = await res.json();
      showToast("注文を作成しました", "success");
      router.push(`/orders/${o.id}`);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "作成に失敗しました", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-sf-surface border-b border-sf-border px-6 py-4 flex items-center gap-3">
        <Link
          href={form.companyId ? `/companies/${form.companyId}` : "/companies"}
          className="text-sf-weak hover:text-sf-text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="text-2xs text-sf-weak">注文</p>
          <h1 className="text-xl font-bold text-sf-text">新規注文</h1>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl">
        <div className="bg-sf-surface rounded-sf shadow-card border border-sf-border p-6 space-y-4">

          {/* 注文番号 */}
          <label className="block">
            <span className="text-xs font-medium text-sf-text">注文番号</span>
            <input
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-400"
              value={form.orderNumber}
              onChange={(e) => set("orderNumber", e.target.value)}
            />
          </label>

          {/* 取引先 */}
          <label className="block">
            <span className="text-xs font-medium text-sf-text">取引先 <span className="text-error">*</span></span>
            <select
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              value={form.companyId}
              onChange={(e) => set("companyId", e.target.value)}
            >
              <option value="">-- 選択 --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </label>

          {/* ステータス */}
          <label className="block">
            <span className="text-xs font-medium text-sf-text">ステータス</span>
            <select
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="DRAFT">下書き</option>
              <option value="CONFIRMED">確定</option>
              <option value="SHIPPED">出荷済み</option>
              <option value="DELIVERED">納品済み</option>
              <option value="CANCELLED">キャンセル</option>
            </select>
          </label>

          {/* 注文日 */}
          <label className="block">
            <span className="text-xs font-medium text-sf-text">注文日</span>
            <input
              type="date"
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              value={form.orderDate}
              onChange={(e) => set("orderDate", e.target.value)}
            />
          </label>

          {/* 金額 */}
          <label className="block">
            <span className="text-xs font-medium text-sf-text">金額 (円)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="mt-1 w-full border border-sf-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
              value={form.totalAmount}
              onChange={(e) => set("totalAmount", e.target.value)}
              placeholder="0"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-primary-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <Link
              href={form.companyId ? `/companies/${form.companyId}` : "/companies"}
              className="px-5 py-2 rounded text-sm font-medium border border-sf-border text-sf-text hover:bg-sf-bg"
            >
              キャンセル
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
