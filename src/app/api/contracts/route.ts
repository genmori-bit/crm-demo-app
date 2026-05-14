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
  if (q) where.contractNumber = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const [total, contracts] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true } },
        deal: { select: { id: true, dealName: true } },
      },
    }),
  ]);

  return NextResponse.json({ contracts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "deal.create");
  if (denied) return denied;

  const body = await req.json();
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);

  const contract = await prisma.contract.create({ data: body });
  return NextResponse.json(contract, { status: 201 });
}
