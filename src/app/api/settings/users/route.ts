import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";
import bcrypt from "bcryptjs";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "MANAGER", "SALES"]).default("SALES"),
  profileId: z.string().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true, email: true, name: true, role: true, status: true,
      department: true, title: true, lastLoginAt: true, createdAt: true,
      profile: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { email, name, role, profileId, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password ?? Math.random().toString(36).slice(2) + "A1!", 10);

  const user = await prisma.user.create({
    data: {
      email, name, passwordHash, role,
      profileId: profileId || null,
      status: "ACTIVE",
      forcePasswordChange: !password,
    },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      objectType: "User",
      objectId: user.id,
      action: "create",
      after: { email, name, role },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
