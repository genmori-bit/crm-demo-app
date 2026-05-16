import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
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
      timezone: true,
      locale: true,
      lastLoginAt: true,
      createdAt: true,
      manager: { select: { id: true, name: true, title: true } },
      reports: {
        where: { deletedAt: null },
        select: { id: true, name: true, title: true, department: true },
        orderBy: { name: "asc" },
      },
      teamMemberships: {
        include: { team: { select: { id: true, name: true } } },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // KPIs
  const [
    ownedDealsCount,
    openPipelineAgg,
    closingThisMonthAgg,
    thisMonthActivityCount,
    thisMonthMeetingCount,
    pendingTaskCount,
    overdueTaskCount,
    accountTeamCount,
  ] = await Promise.all([
    prisma.deal.count({
      where: { ownerId: id, deletedAt: null, stage: { notIn: ["won", "lost"] } },
    }),
    prisma.deal.aggregate({
      where: { ownerId: id, deletedAt: null, stage: { notIn: ["won", "lost"] } },
      _sum: { amount: true },
    }),
    prisma.deal.aggregate({
      where: {
        ownerId: id,
        deletedAt: null,
        stage: { notIn: ["won", "lost"] },
        expectedCloseDate: {
          gte: thisMonthStart,
          lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      },
      _sum: { amount: true },
    }),
    prisma.activity.count({
      where: { ownerId: id, activityDate: { gte: thisMonthStart }, deletedAt: null },
    }),
    prisma.activity.count({
      where: {
        ownerId: id,
        type: "meeting",
        activityDate: { gte: thisMonthStart },
        deletedAt: null,
      },
    }),
    prisma.task.count({
      where: { assigneeId: id, status: { not: "done" } },
    }),
    prisma.task.count({
      where: {
        assigneeId: id,
        status: { not: "done" },
        dueDate: { lt: now },
      },
    }),
    prisma.accountTeamMember.count({ where: { userId: id } }),
  ]);

  // Recent activities
  const recentActivities = await prisma.activity.findMany({
    where: { ownerId: id, deletedAt: null },
    orderBy: { activityDate: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      subject: true,
      outcome: true,
      activityDate: true,
      durationMinutes: true,
      nextAction: true,
      nextActionDueDate: true,
      company: { select: { id: true, companyName: true } },
      deal: { select: { id: true, dealName: true } },
      contact: { select: { id: true, fullName: true } },
    },
  });

  // Owned deals
  const ownedDeals = await prisma.deal.findMany({
    where: { ownerId: id, deletedAt: null },
    orderBy: [{ stage: "asc" }, { expectedCloseDate: "asc" }],
    take: 30,
    select: {
      id: true,
      dealName: true,
      stage: true,
      amount: true,
      probability: true,
      expectedCloseDate: true,
      lastActivityAt: true,
      nextAction: true,
      riskLevel: true,
      activityCount: true,
      company: { select: { id: true, companyName: true } },
    },
  });

  // Account team memberships
  const accountTeams = await prisma.accountTeamMember.findMany({
    where: { userId: id },
    select: {
      role: true,
      isPrimary: true,
      company: { select: { id: true, companyName: true, tier: true, healthScore: true, lifecycleStage: true } },
    },
    orderBy: { company: { companyName: "asc" } },
    take: 30,
  });

  // Pending tasks
  const pendingTasks = await prisma.task.findMany({
    where: { assigneeId: id, status: { not: "done" } },
    orderBy: [{ dueDate: "asc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      dueDate: true,
      company: { select: { id: true, companyName: true } },
      deal: { select: { id: true, dealName: true } },
    },
  });

  // Activity breakdown by type (this month)
  const activityBreakdown = await prisma.activity.groupBy({
    by: ["type"],
    where: { ownerId: id, activityDate: { gte: thisMonthStart }, deletedAt: null },
    _count: { id: true },
  });

  // Deals with no activity in 30 days
  const staleDealCount = await prisma.deal.count({
    where: {
      ownerId: id,
      deletedAt: null,
      stage: { notIn: ["won", "lost"] },
      OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: thirtyDaysAgo } }],
    },
  });

  return NextResponse.json({
    ...user,
    kpis: {
      ownedDealsCount,
      openPipelineAmount: openPipelineAgg._sum.amount ?? 0,
      closingThisMonthAmount: closingThisMonthAgg._sum.amount ?? 0,
      thisMonthActivityCount,
      thisMonthMeetingCount,
      pendingTaskCount,
      overdueTaskCount,
      accountTeamCount,
      staleDealCount,
    },
    recentActivities,
    ownedDeals,
    accountTeams,
    pendingTasks,
    activityBreakdown,
  });
}
