import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toBOM(csv: string) {
  return "﻿" + csv;
}

function toCsvRow(values: (string | number | boolean | null | undefined)[]) {
  return values
    .map((v) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const objectType = new URL(request.url).searchParams.get("type") ?? "company";

  let csvContent = "";

  if (objectType === "company") {
    const rows = await prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    const header = toCsvRow(["会社名", "業種", "ステータス", "規模", "年商", "担当者", "電話", "Web", "メモ", "登録日"]);
    const lines = rows.map((r) =>
      toCsvRow([r.companyName, r.industry, r.status, r.employeeSize, r.annualRevenue, r.ownerName, r.phone, r.website, r.memo, r.createdAt.toISOString().slice(0, 10)])
    );
    csvContent = [header, ...lines].join("\n");
  } else if (objectType === "contact") {
    const rows = await prisma.contact.findMany({
      where: { deletedAt: null },
      include: { company: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
    });
    const header = toCsvRow(["氏名", "企業", "部署", "役職", "メール", "電話", "登録日"]);
    const lines = rows.map((r) =>
      toCsvRow([r.fullName, r.company.companyName, r.department, r.title, r.email, r.phone, r.createdAt.toISOString().slice(0, 10)])
    );
    csvContent = [header, ...lines].join("\n");
  } else if (objectType === "deal") {
    const rows = await prisma.deal.findMany({
      where: { deletedAt: null },
      include: {
        company: { select: { companyName: true } },
        contact: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const header = toCsvRow(["商談名", "企業", "担当者", "ステージ", "金額", "確度", "クローズ予定日", "次回アクション", "登録日"]);
    const lines = rows.map((r) =>
      toCsvRow([r.dealName, r.company.companyName, r.contact?.fullName, r.stage, r.amount, r.probability, r.expectedCloseDate?.toISOString().slice(0, 10), r.nextAction, r.createdAt.toISOString().slice(0, 10)])
    );
    csvContent = [header, ...lines].join("\n");
  }

  const bom = toBOM(csvContent);
  return new NextResponse(bom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${objectType}_export.csv"`,
    },
  });
}
