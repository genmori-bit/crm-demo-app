import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user);
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const take = Math.min(Number(searchParams.get("take") ?? "100"), 500);

  const logs = await prisma.loginHistory.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(logs);
}
