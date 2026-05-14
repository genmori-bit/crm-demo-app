import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

const memberSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "lead"]).default("member"),
  action: z.enum(["add", "remove"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();

  // Member management
  if ("action" in body) {
    const parsed = memberSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.action === "add") {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: id, userId: parsed.data.userId } },
        update: { role: parsed.data.role },
        create: { teamId: id, userId: parsed.data.userId, role: parsed.data.role },
      });
    } else {
      await prisma.teamMember.deleteMany({ where: { teamId: id, userId: parsed.data.userId } });
    }
    return NextResponse.json({ success: true });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const team = await prisma.team.update({ where: { id }, data: parsed.data });
  return NextResponse.json(team);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
