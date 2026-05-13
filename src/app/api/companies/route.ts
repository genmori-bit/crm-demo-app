import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations/company";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const industry = searchParams.get("industry") ?? "";

  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      AND: [
        query
          ? {
              OR: [
                { companyName: { contains: query } },
                { ownerName: { contains: query } },
                { industry: { contains: query } },
              ],
            }
          : {},
        status ? { status } : {},
        industry ? { industry: { contains: industry } } : {},
      ],
    },
    include: {
      _count: { select: { contacts: true, deals: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.create({ data: parsed.data });
  return NextResponse.json(company, { status: 201 });
}
