import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceBooks = await prisma.priceBook.findMany({
    where: { deletedAt: null },
    orderBy: [{ isStandard: "desc" }, { name: "asc" }],
    include: { _count: { select: { entries: true } } },
  });
  return NextResponse.json(priceBooks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const priceBook = await prisma.priceBook.create({ data: body });
  return NextResponse.json(priceBook, { status: 201 });
}
