import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/lib/validations/deal";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const validSortFields = ["createdAt", "expectedCloseDate", "amount"];
  const safeSort = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const deals = await prisma.deal.findMany({
    where: {
      AND: [
        query ? { dealName: { contains: query } } : {},
        stage ? { stage } : {},
        companyId ? { companyId } : {},
      ],
    },
    include: {
      company: { select: { companyName: true } },
      contact: { select: { fullName: true } },
    },
    orderBy: { [safeSort]: order },
  });

  return NextResponse.json(deals);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { expectedCloseDate, contactId, ...rest } = parsed.data;
  const deal = await prisma.deal.create({
    data: {
      ...rest,
      contactId: contactId || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    },
    include: {
      company: { select: { companyName: true } },
      contact: { select: { fullName: true } },
    },
  });
  return NextResponse.json(deal, { status: 201 });
}
