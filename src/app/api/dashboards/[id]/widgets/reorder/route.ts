import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboard, canEdit, reorderWidgets } from "@/lib/services/dashboard-service";

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

  const { orderedIds } = await request.json();
  if (!Array.isArray(orderedIds)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await reorderWidgets(id, orderedIds, session.user.id ?? "");
  return NextResponse.json({ ok: true });
}
