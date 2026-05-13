import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations/company";
import { createAuditLog } from "@/lib/services/audit-log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }] },
      deals: { orderBy: { createdAt: "desc" } },
      activities: {
        orderBy: { activityDate: "desc" },
        include: { contact: { select: { fullName: true } } },
        take: 10,
      },
      tasks: {
        where: { status: { not: "done" } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const before = await prisma.company.findUnique({ where: { id } });
  const body = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.update({ where: { id }, data: parsed.data });
  await createAuditLog({ userId: session.user?.id, objectType: "Company", objectId: id, action: "UPDATE", before: before as Record<string, unknown>, after: company as Record<string, unknown> });
  return NextResponse.json(company);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const before = await prisma.company.findUnique({ where: { id } });
  await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId: session.user?.id, objectType: "Company", objectId: id, action: "DELETE", before: before as Record<string, unknown> });
  return NextResponse.json({ success: true });
}
