import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, companyName: true } },
      contract: { select: { id: true, contractNumber: true } },
      items: { include: { product: { select: { id: true, name: true, productCode: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.edit");
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json();
  if (body.orderDate) body.orderDate = new Date(body.orderDate);
  const order = await prisma.order.update({ where: { id }, data: body });
  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.delete");
  if (denied) return denied;
  const { id } = await params;
  await prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
