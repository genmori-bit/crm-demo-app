import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboard, updateDashboard, deleteDashboard, canEdit } from "@/lib/services/dashboard-service";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).optional(),
  defaultDateRange: z.string().nullable().optional(),
  filters: z.unknown().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(dashboard);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await updateDashboard(id, parsed.data as Parameters<typeof updateDashboard>[1], session.user.id ?? "");
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dashboard = await getDashboard(id);
  if (!dashboard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(dashboard, session.user.id ?? "", session.user.role ?? "SALES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteDashboard(id, session.user.id ?? "");
  return NextResponse.json({ ok: true });
}
