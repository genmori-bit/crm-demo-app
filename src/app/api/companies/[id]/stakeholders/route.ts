import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const stakeholders = await prisma.accountStakeholder.findMany({
      where: { companyId: id },
      include: {
        contact: { select: { id: true, fullName: true, email: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(stakeholders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const stakeholder = await prisma.accountStakeholder.upsert({
      where: { companyId_contactId: { companyId: id, contactId: body.contactId } },
      create: {
        companyId: id,
        contactId: body.contactId,
        influenceLevel: body.influenceLevel || "MEDIUM",
        attitude: body.attitude || "UNKNOWN",
        decisionRole: body.decisionRole || "OTHER",
        notes: body.notes,
      },
      update: {
        influenceLevel: body.influenceLevel,
        attitude: body.attitude,
        decisionRole: body.decisionRole,
        notes: body.notes,
      },
      include: {
        contact: { select: { id: true, fullName: true, email: true, title: true } },
      },
    });
    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
