import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.view");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = { deletedAt: null };
  if (q) where.orderNumber = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true } },
        contract: { select: { id: true, contractNumber: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.create");
  if (denied) return denied;

  const body = await req.json();
  const { items, ...orderData } = body;
  if (orderData.orderDate) orderData.orderDate = new Date(orderData.orderDate);

  const order = await prisma.order.create({
    data: {
      ...orderData,
      items: items ? { create: items } : undefined,
    },
    include: { items: true },
  });
  return NextResponse.json(order, { status: 201 });
}
