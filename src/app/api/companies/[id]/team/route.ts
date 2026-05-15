import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const members = await prisma.accountTeamMember.findMany({
      where: { companyId: id },
      include: { user: { select: { id: true, name: true, email: true, department: true } } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(members);
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
    const member = await prisma.accountTeamMember.upsert({
      where: { companyId_userId: { companyId: id, userId: body.userId } },
      create: {
        companyId: id,
        userId: body.userId,
        role: body.role || "SALES_REP",
        isPrimary: body.isPrimary || false,
      },
      update: { role: body.role, isPrimary: body.isPrimary },
      include: { user: { select: { id: true, name: true, email: true, department: true } } },
    });
    return NextResponse.json(member);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
