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
  const dealId = searchParams.get("dealId") ?? "";
  const where: any = { deletedAt: null };
  if (dealId) where.dealId = dealId;

  const quotes = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      deal: { select: { id: true, dealName: true } },
      lineItems: { include: { product: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.create");
  if (denied) return denied;

  const body = await req.json();
  const { lineItems, ...quoteData } = body;
  if (quoteData.expirationDate) quoteData.expirationDate = new Date(quoteData.expirationDate);

  const quote = await prisma.quote.create({
    data: {
      ...quoteData,
      lineItems: lineItems ? { create: lineItems } : undefined,
    },
    include: { lineItems: true },
  });
  return NextResponse.json(quote, { status: 201 });
}
