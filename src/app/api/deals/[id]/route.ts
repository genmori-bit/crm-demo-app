import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dealSchema } from "@/lib/validations/deal";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      company: true,
      contact: true,
      activities: {
        orderBy: { activityDate: "desc" },
        include: { contact: { select: { fullName: true } } },
      },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { expectedCloseDate, contactId, ...rest } = parsed.data;
  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...rest,
      contactId: contactId || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    },
  });
  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
