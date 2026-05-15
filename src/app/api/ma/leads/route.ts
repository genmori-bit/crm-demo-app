import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const lifecycleStage = searchParams.get("lifecycleStage") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (lifecycleStage) where.lifecycleStage = lifecycleStage;
  if (status) where.status = status;

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { email, fullName, firstName, lastName, ...rest } = body;

  if (!email) return NextResponse.json({ error: "メールは必須です" }, { status: 400 });

  const existing = await prisma.lead.findFirst({ where: { email, deletedAt: null } });
  if (existing) return NextResponse.json({ error: "このメールアドレスのリードは既に存在します" }, { status: 409 });

  const lead = await prisma.lead.create({
    data: {
      email,
      fullName: fullName || [lastName, firstName].filter(Boolean).join(" ") || email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      ...rest,
      status: rest.status ?? "NEW",
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
