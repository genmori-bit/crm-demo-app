import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboard, canEdit, addWidget } from "@/lib/services/dashboard-service";

type Params = { params: Promise<{ id: string; widgetId: string }> };

export async function POST(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, widgetId } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const original = await prisma.dashboardWidget.findUnique({ where: { id: widgetId } });
  if (!original) return NextResponse.json({ error: "Widget not found" }, { status: 404 });

  const copy = await addWidget(
    id,
    {
      reportId: original.reportId,
      title: `${original.title} (コピー)`,
      widgetType: original.widgetType,
      config: original.config ?? {},
      size: original.size,
    },
    session.user.id ?? "",
  );
  return NextResponse.json(copy, { status: 201 });
}
