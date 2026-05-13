import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const program = await prisma.engagementProgram.findFirst({
    where: { id, deletedAt: null },
    include: {
      nodes: true,
      _count: { select: { enrollments: true } },
      enrollments: { orderBy: { enrolledAt: "desc" }, take: 10, include: { prospect: { select: { id: true, email: true, firstName: true, lastName: true } } } },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(program);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const program = await prisma.engagementProgram.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
  return NextResponse.json(program);
}
