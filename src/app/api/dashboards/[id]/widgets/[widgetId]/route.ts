import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateWidget, deleteWidget, getDashboard, canEdit } from "@/lib/services/dashboard-service";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  widgetType: z.enum(["KPI", "TABLE", "BAR", "LINE", "PIE", "DONUT", "FUNNEL"]).optional(),
  config: z.record(z.unknown()).optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "WIDE", "FULL"]).optional(),
  sortOrder: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string; widgetId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, widgetId } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const widget = await updateWidget(widgetId, parsed.data, session.user.id ?? "");
  return NextResponse.json(widget);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, widgetId } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteWidget(widgetId, id, session.user.id ?? "");
  return NextResponse.json({ ok: true });
}
