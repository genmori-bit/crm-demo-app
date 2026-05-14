import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).default({}),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const sets = await prisma.permissionSet.findMany({
    orderBy: [{ isSystem: "desc" }, { label: "asc" }],
    include: { _count: { select: { assignments: true } } },
  });
  return NextResponse.json(sets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ps = await prisma.permissionSet.create({ data: parsed.data });
  return NextResponse.json(ps, { status: 201 });
}
