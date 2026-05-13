import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runReport } from "@/lib/services/report-query-builder";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const report = await prisma.report.findFirst({ where: { id, deletedAt: null } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await runReport({
    objectType: report.objectType,
    columns: report.columns as string[],
    filters: report.filters as { field: string; operator: string; value: string }[],
    sortField: report.sortField,
    sortDir: report.sortDir,
    groupBy: report.groupBy,
  });

  return NextResponse.json({ rows, columns: report.columns, objectType: report.objectType });
}
