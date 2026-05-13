import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDashboards, createDashboard } from "@/lib/services/dashboard-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).default("PRIVATE"),
  defaultDateRange: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filter = new URL(request.url).searchParams.get("filter") ?? "all";
  const dashboards = await listDashboards(session.user.id ?? "", session.user.role ?? "SALES", filter);
  return NextResponse.json(dashboards);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userId = session.user.id ?? "";
  const dashboard = await createDashboard({ ...parsed.data, ownerId: userId || undefined }, userId);
  return NextResponse.json(dashboard, { status: 201 });
}
