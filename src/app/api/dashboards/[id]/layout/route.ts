/**
 * POST /api/dashboards/[id]/layout
 *
 * Bulk-save widget positions after drag-and-drop in the Dashboard Builder.
 * Accepts an array of { widgetId, position: { x, y, w, h } } and updates
 * each widget's position field atomically.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboard, canEdit } from "@/lib/services/dashboard-service";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/services/audit-log";
import { z } from "zod";

const positionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

const layoutItemSchema = z.object({
  widgetId: z.string().min(1),
  position: positionSchema,
});

const bodySchema = z.object({
  items: z.array(layoutItemSchema).min(1),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Validate all widget IDs belong to this dashboard
  const dashboardWidgetIds = new Set(dashboard.widgets.map((w) => w.id));
  for (const item of parsed.data.items) {
    if (!dashboardWidgetIds.has(item.widgetId)) {
      return NextResponse.json(
        { error: `Widget ${item.widgetId} does not belong to this dashboard` },
        { status: 400 },
      );
    }
  }

  // Bulk update positions in a transaction
  await prisma.$transaction(
    parsed.data.items.map(({ widgetId, position }) =>
      prisma.dashboardWidget.update({
        where: { id: widgetId },
        data: { position },
      }),
    ),
  );

  await createAuditLog({
    userId: session.user.id ?? "",
    objectType: "Dashboard",
    objectId: id,
    action: "UPDATE",
    after: { layoutUpdated: true, widgetCount: parsed.data.items.length } as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
