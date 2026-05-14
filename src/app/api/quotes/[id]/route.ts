import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id, deletedAt: null },
    include: {
      deal: { select: { id: true, dealName: true, company: { select: { id: true, companyName: true } } } },
      lineItems: { include: { product: { select: { id: true, name: true, productCode: true } } } },
    },
  });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.edit");
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json();
  if (body.expirationDate) body.expirationDate = new Date(body.expirationDate);
  const quote = await prisma.quote.update({ where: { id }, data: body });
  return NextResponse.json(quote);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.delete");
  if (denied) return denied;
  const { id } = await params;
  await prisma.quote.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
