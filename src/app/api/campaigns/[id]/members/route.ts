import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const members = await prisma.campaignMember.findMany({
    where: { campaignId: id },
    include: {
      lead:    { select: { id: true, fullName: true, email: true } },
      contact: { select: { id: true, fullName: true, email: true } },
      company: { select: { id: true, companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // body: { type: "lead"|"contact"|"company", targetId: string, status?: string }
  const { type, targetId, status = "SENT" } = body;

  if (!type || !targetId) {
    return NextResponse.json({ error: "type と targetId は必須です" }, { status: 400 });
  }

  const data: {
    campaignId: string;
    status: string;
    leadId?: string;
    contactId?: string;
    companyId?: string;
  } = { campaignId: id, status };

  if (type === "lead")    data.leadId    = targetId;
  if (type === "contact") data.contactId = targetId;
  if (type === "company") data.companyId = targetId;

  // 重複チェック
  const existing = await prisma.campaignMember.findFirst({ where: { ...data } });
  if (existing) {
    return NextResponse.json({ error: "すでにメンバーとして追加されています" }, { status: 409 });
  }

  const member = await prisma.campaignMember.create({
    data,
    include: {
      lead:    { select: { id: true, fullName: true, email: true } },
      contact: { select: { id: true, fullName: true, email: true } },
      company: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
