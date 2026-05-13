import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectType: z.enum(["deal", "company", "contact", "activity"]),
  columns: z.array(z.string()).min(1),
  filters: z.array(z.object({ field: z.string(), operator: z.string(), value: z.string() })).default([]),
  sortField: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  groupBy: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { deletedAt: null },
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(reports);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await prisma.report.create({
    data: { ...parsed.data, createdById: session.user?.id ?? "" },
  });
  return NextResponse.json(report, { status: 201 });
}
