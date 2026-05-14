import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  productCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  family: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const where: any = { deletedAt: null };
  if (q) where.name = { contains: q, mode: "insensitive" };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { priceBookEntries: { include: { priceBook: { select: { id: true, name: true } } } } },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.create");
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const product = await prisma.product.create({ data: parsed.data as any });
  return NextResponse.json(product, { status: 201 });
}
