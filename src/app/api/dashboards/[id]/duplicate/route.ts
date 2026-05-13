import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { duplicateDashboard } from "@/lib/services/dashboard-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const copy = await duplicateDashboard(id, session.user.id ?? "");
  return NextResponse.json(copy, { status: 201 });
}
