import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  permissions: z.record(z.boolean()).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (profile?.isSystem) return NextResponse.json({ error: "システムプロファイルは変更できません" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.profile.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (profile?.isSystem) return NextResponse.json({ error: "システムプロファイルは削除できません" }, { status: 400 });
  if ((profile?._count?.users ?? 0) > 0) return NextResponse.json({ error: "このプロファイルを使用しているユーザーがいます" }, { status: 400 });

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
