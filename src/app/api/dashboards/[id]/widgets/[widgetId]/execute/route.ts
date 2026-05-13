import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeReportForWidget } from "@/lib/services/report-execution-service";

type Params = { params: Promise<{ id: string; widgetId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { widgetId } = await params;
  const widget = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
    include: { report: true },
  });
  if (!widget) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const dashFilters = {
    dateRange: searchParams.get("dateRange") ?? undefined,
    stage: searchParams.get("stage") ?? undefined,
    companyStatus: searchParams.get("companyStatus") ?? undefined,
  };

  const result = await executeReportForWidget(
    {
      id: widget.report.id,
      objectType: widget.report.objectType,
      columns: widget.report.columns as string[],
      filters: widget.report.filters as unknown[],
      sortField: widget.report.sortField,
      sortDir: widget.report.sortDir,
    },
    widget.widgetType as import("@/lib/services/report-execution-service").WidgetType,
    widget.config as Record<string, unknown>,
    dashFilters,
  );

  return NextResponse.json(result);
}
