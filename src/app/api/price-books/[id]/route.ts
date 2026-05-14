import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const priceBook = await prisma.priceBook.findUnique({
    where: { id, deletedAt: null },
    include: {
      entries: {
        include: { product: { select: { id: true, name: true, productCode: true, family: true } } },
        orderBy: { unitPrice: "asc" },
      },
    },
  });
  if (!priceBook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(priceBook);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const priceBook = await prisma.priceBook.update({ where: { id }, data: body });
  return NextResponse.json(priceBook);
}
