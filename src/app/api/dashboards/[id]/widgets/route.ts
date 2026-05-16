import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addWidget, getDashboard, canEdit } from "@/lib/services/dashboard-service";
import { z } from "zod";

const widgetSchema = z.object({
  reportId: z.string().min(1),
  title: z.string().min(1),
  widgetType: z.enum(["KPI", "TABLE", "BAR", "LINE", "PIE", "DONUT", "FUNNEL", "RANKING", "RISK_LIST"]),
  config: z.record(z.unknown()).default({}),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "WIDE", "FULL"]).default("MEDIUM"),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
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
  const parsed = widgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const widget = await addWidget(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(widget, { status: 201 });
}
