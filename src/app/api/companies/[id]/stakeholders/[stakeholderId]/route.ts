import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; stakeholderId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stakeholderId } = await params;
  try {
    const body = await req.json();
    const stakeholder = await prisma.accountStakeholder.update({
      where: { id: stakeholderId },
      data: body,
      include: {
        contact: { select: { id: true, fullName: true, email: true, title: true } },
      },
    });
    return NextResponse.json(stakeholder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stakeholderId } = await params;
  try {
    await prisma.accountStakeholder.delete({ where: { id: stakeholderId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
