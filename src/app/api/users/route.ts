import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const department = searchParams.get("department") ?? "";
  const role = searchParams.get("role") ?? "";

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { department: { contains: query, mode: "insensitive" } },
                { title: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        department ? { department: { contains: department, mode: "insensitive" } } : {},
        role ? { role } : {},
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      title: true,
      phone: true,
      mobilePhone: true,
      avatarUrl: true,
      managerId: true,
      lastLoginAt: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
      _count: {
        select: {
          ownedDeals: { where: { deletedAt: null, stage: { notIn: ["won", "lost"] } } },
          accountTeamMemberships: true,
          ownedActivities: true,
          assignedTasks: { where: { status: { not: "done" } } },
        },
      },
    },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}
