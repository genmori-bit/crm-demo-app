import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, companyName: true } },
      deal: { select: { id: true, dealName: true } },
      orders: true,
      subscriptions: true,
    },
  });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.edit");
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json();
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);
  const contract = await prisma.contract.update({ where: { id }, data: body });
  return NextResponse.json(contract);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.delete");
  if (denied) return denied;
  const { id } = await params;
  await prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
