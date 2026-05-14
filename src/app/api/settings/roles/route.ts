import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const roles = await prisma.role.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { parent: { select: { id: true, name: true } }, _count: { select: { children: true } } },
  });
  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const role = await prisma.role.create({ data: parsed.data });
  return NextResponse.json(role, { status: 201 });
}
