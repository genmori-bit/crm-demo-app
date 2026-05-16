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
      company: { select: { id: true, companyName: true } },
      contact: { select: { id: true, fullName: true } },
      owner: { select: { id: true, name: true, department: true } },
      salesRep: { select: { id: true, name: true } },
      salesEngineer: { select: { id: true, name: true } },
      teamMembers: {
        include: {
          user: { select: { id: true, name: true, title: true } },
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      activities: {
        orderBy: { activityDate: "desc" },
        include: {
          contact: { select: { id: true, fullName: true } },
          owner: { select: { id: true, name: true } },
          company: { select: { id: true, companyName: true } },
          deal: { select: { id: true, dealName: true } },
        },
        take: 50,
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
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
  const parsed = dealSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { expectedCloseDate, contactId, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if ("contactId" in parsed.data) updateData.contactId = contactId || null;
  if ("expectedCloseDate" in parsed.data) {
    updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: updateData,
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
