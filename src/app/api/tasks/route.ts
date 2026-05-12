import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const dealId = searchParams.get("dealId") ?? "";

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        status ? { status } : {},
        companyId ? { companyId } : {},
        dealId ? { dealId } : {},
      ],
    },
    include: {
      company: { select: { companyName: true } },
      deal: { select: { dealName: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, companyId, dealId, ...rest } = parsed.data;
  const task = await prisma.task.create({
    data: {
      ...rest,
      companyId: companyId || null,
      dealId: dealId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      company: { select: { companyName: true } },
      deal: { select: { dealName: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}
