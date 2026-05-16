import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = startOfDay(now);
  const staleThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    companyCount,
    contactCount,
    allCompanies,
    allDeals,
    closingThisMonth,
    allTasks,
    recentActivities,
    dealsByStage,
    staleDealsCount,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.contact.count(),
    prisma.company.findMany({ select: { status: true } }),
    prisma.deal.findMany({ select: { amount: true, probability: true, stage: true } }),
    prisma.deal.findMany({
      where: {
        stage: { notIn: ["won", "lost"] },
        expectedCloseDate: { gte: monthStart, lte: monthEnd },
      },
      include: { company: { select: { companyName: true } } },
      orderBy: { expectedCloseDate: "asc" },
    }),
    prisma.task.findMany({
      select: {
        status: true,
        dueDate: true,
        title: true,
        priority: true,
        id: true,
        company: { select: { companyName: true } },
      },
    }),
    prisma.activity.findMany({
      orderBy: { activityDate: "desc" },
      take: 10,
      include: {
        company: { select: { id: true, companyName: true } },
        contact: { select: { id: true, fullName: true } },
        deal: { select: { id: true, dealName: true } },
      },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      _sum: { amount: true },
    }),
    // Deals with no activity in 14+ days (active stages only)
    prisma.deal.count({
      where: {
        stage: { notIn: ["won", "lost"] },
        OR: [
          { activities: { none: {} } },
          { activities: { every: { activityDate: { lt: staleThreshold } } } },
        ],
      },
    }),
  ]);

  const activeDeals = allDeals.filter((d) => !["won", "lost"].includes(d.stage));
  const activeDealsCount = activeDeals.length;
  const activeDealsAmount = activeDeals.reduce((s, d) => s + d.amount, 0);
  const expectedRevenue = activeDeals.reduce(
    (s, d) => s + (d.amount * d.probability) / 100,
    0
  );

  const companyStatusCounts = allCompanies.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const pendingTasks = (allTasks as Array<typeof allTasks[number] & { company: { companyName: string } | null }>)
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const pa = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
      const pb = b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2;
      return pa - pb;
    })
    .slice(0, 8);

  const overdueTasksCount = (allTasks as Array<typeof allTasks[number]>).filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today
  ).length;

  const pendingTasksCount = (allTasks as Array<typeof allTasks[number]>).filter(
    (t) => t.status !== "done"
  ).length;

  return NextResponse.json({
    companyCount,
    contactCount,
    activeDealsCount,
    activeDealsAmount,
    expectedRevenue,
    closingThisMonth,
    pendingTasks,
    pendingTasksCount,
    overdueTasksCount,
    staleDealsCount,
    recentActivities,
    dealsByStage,
    companyStatusCounts,
  });
}
