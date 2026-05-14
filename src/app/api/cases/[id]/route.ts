import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const caseRecord = await prisma.case.findUnique({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, companyName: true } },
      contact: { select: { id: true, fullName: true, email: true } },
      tasks: { where: { status: { not: "done" } }, orderBy: { dueDate: "asc" } },
    },
  });

  if (!caseRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(caseRecord);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.edit");
  if (denied) return denied;
  const { id } = await params;

  const body = await req.json();
  const data: any = { ...body };
  if (data.resolvedAt) data.resolvedAt = new Date(data.resolvedAt);

  const caseRecord = await prisma.case.update({ where: { id }, data });
  return NextResponse.json(caseRecord);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.delete");
  if (denied) return denied;
  const { id } = await params;

  await prisma.case.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
