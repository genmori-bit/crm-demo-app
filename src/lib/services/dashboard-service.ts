import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit-log";

export type DashboardWithWidgets = Awaited<ReturnType<typeof getDashboard>>;

export async function listDashboards(userId: string, userRole: string, filter?: string) {
  const where: Record<string, unknown> = { deletedAt: null };

  if (filter === "mine") {
    where.ownerId = userId;
  } else if (filter === "shared") {
    where.visibility = { in: ["TEAM", "PUBLIC"] };
  } else {
    // all: own + shared
    if (userRole === "SALES") {
      where.OR = [{ ownerId: userId }, { visibility: { in: ["TEAM", "PUBLIC"] } }];
    }
  }

  return prisma.dashboard.findMany({
    where,
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { widgets: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDashboard(id: string) {
  return prisma.dashboard.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { name: true, email: true } },
      widgets: {
        include: { report: { select: { id: true, name: true, objectType: true, isPublic: true, createdById: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function createDashboard(
  data: { name: string; description?: string | null; visibility: string; defaultDateRange?: string | null; ownerId?: string },
  userId: string,
) {
  const dashboard = await prisma.dashboard.create({ data });
  await createAuditLog({ userId, objectType: "Dashboard", objectId: dashboard.id, action: "CREATE", after: data as Record<string, unknown> });
  return dashboard;
}

export async function updateDashboard(
  id: string,
  data: Partial<{ name: string; description: string | null; visibility: string; defaultDateRange: string | null; filters: import("@prisma/client").Prisma.InputJsonValue; layout: import("@prisma/client").Prisma.InputJsonValue }>,
  userId: string,
) {
  const before = await prisma.dashboard.findUnique({ where: { id } });
  const dashboard = await prisma.dashboard.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "Dashboard", objectId: id, action: "UPDATE", before: before as Record<string, unknown>, after: data as Record<string, unknown> });
  return dashboard;
}

export async function deleteDashboard(id: string, userId: string) {
  await prisma.dashboard.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId, objectType: "Dashboard", objectId: id, action: "DELETE" });
}

export async function duplicateDashboard(id: string, userId: string) {
  const original = await getDashboard(id);
  if (!original) throw new Error("Not found");

  const copy = await prisma.dashboard.create({
    data: {
      name: `${original.name} (コピー)`,
      description: original.description,
      visibility: "PRIVATE",
      defaultDateRange: original.defaultDateRange,
      ownerId: userId,
    },
  });

  for (const w of original.widgets) {
    await prisma.dashboardWidget.create({
      data: {
        dashboardId: copy.id,
        reportId: w.reportId,
        title: w.title,
        widgetType: w.widgetType,
        config: w.config ?? {},
        position: w.position ?? {},
        size: w.size,
        sortOrder: w.sortOrder,
      },
    });
  }

  await createAuditLog({ userId, objectType: "Dashboard", objectId: copy.id, action: "CREATE", after: { duplicatedFrom: id } });
  return copy;
}

export async function addWidget(
  dashboardId: string,
  data: { reportId: string; title: string; widgetType: string; config?: unknown; size?: string; sortOrder?: number },
  userId: string,
) {
  const maxOrder = await prisma.dashboardWidget.aggregate({ where: { dashboardId }, _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const widget = await prisma.dashboardWidget.create({
    data: {
      dashboardId,
      reportId: data.reportId,
      title: data.title,
      widgetType: data.widgetType,
      config: (data.config ?? {}) as object,
      size: data.size ?? "MEDIUM",
      sortOrder: data.sortOrder ?? nextOrder,
    },
  });
  await prisma.dashboard.update({ where: { id: dashboardId }, data: { updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "DashboardWidget", objectId: widget.id, action: "CREATE", after: data as Record<string, unknown> });
  return widget;
}

export async function updateWidget(
  id: string,
  data: Partial<{ title: string; widgetType: string; config: unknown; size: string; sortOrder: number }>,
  userId: string,
) {
  const widget = await prisma.dashboardWidget.update({ where: { id }, data: { ...data, config: (data.config ?? undefined) as object | undefined, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "DashboardWidget", objectId: id, action: "UPDATE", after: data as Record<string, unknown> });
  return widget;
}

export async function deleteWidget(id: string, dashboardId: string, userId: string) {
  await prisma.dashboardWidget.delete({ where: { id } });
  await prisma.dashboard.update({ where: { id: dashboardId }, data: { updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "DashboardWidget", objectId: id, action: "DELETE" });
}

export async function reorderWidgets(dashboardId: string, orderedIds: string[], userId: string) {
  await Promise.all(
    orderedIds.map((id, idx) => prisma.dashboardWidget.update({ where: { id }, data: { sortOrder: idx } }))
  );
  await prisma.dashboard.update({ where: { id: dashboardId }, data: { updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "Dashboard", objectId: dashboardId, action: "UPDATE", after: { reordered: true } });
}

export function canEdit(dashboard: { ownerId: string | null; visibility: string }, userId: string, userRole: string) {
  if (userRole === "ADMIN") return true;
  if (dashboard.ownerId === userId) return true;
  if (userRole === "MANAGER" && dashboard.visibility === "TEAM") return true;
  return false;
}
