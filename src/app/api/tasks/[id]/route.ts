import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Allow partial update for status toggle
  if (Object.keys(body).length === 1 && "status" in body) {
    const task = await prisma.task.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(task);
  }

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, companyId, dealId, ...rest } = parsed.data;
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      companyId: companyId || null,
      dealId: dealId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
