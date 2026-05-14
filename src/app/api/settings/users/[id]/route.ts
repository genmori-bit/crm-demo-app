import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "SALES"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "LOCKED"]).optional(),
  profileId: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  timezone: z.string().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: { select: { id: true, name: true } },
      permissionSetAssignments: {
        include: { permissionSet: { select: { id: true, name: true, label: true } } },
      },
      teamMemberships: {
        include: { team: { select: { id: true, name: true } } },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { password, ...data } = parsed.data;
  const updateData: Record<string, unknown> = { ...data };
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
    updateData.passwordChangedAt = new Date();
    updateData.forcePasswordChange = false;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      objectType: "User",
      objectId: id,
      action: "update",
      after: data,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "自分自身を削除することはできません" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: "DISABLED" } });
  return NextResponse.json({ success: true });
}
