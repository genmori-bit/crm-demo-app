import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  userId: z.string(),
  appId: z.string(),
  action: z.enum(["grant", "revoke"]),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const [users, accessRecords] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true, appAccess: { select: { appId: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.userAppAccess.findMany(),
  ]);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, appId, action } = parsed.data;
  if (action === "grant") {
    await prisma.userAppAccess.upsert({
      where: { userId_appId: { userId, appId } },
      update: {},
      create: { userId, appId },
    });
  } else {
    await prisma.userAppAccess.deleteMany({ where: { userId, appId } });
  }
  return NextResponse.json({ success: true });
}
