import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMarketingList, updateMarketingList, deleteMarketingList, addProspectToList, removeProspectFromList } from "@/lib/services/list-service";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const list = await getMarketingList(id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(list);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  if (body.action === "add_prospect") {
    await addProspectToList(id, body.prospectId, "manual");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "remove_prospect") {
    await removeProspectFromList(id, body.prospectId);
    return NextResponse.json({ ok: true });
  }

  const schema = z.object({ name: z.string().optional(), description: z.string().nullable().optional(), isPublic: z.boolean().optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const list = await updateMarketingList(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(list);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteMarketingList(id, session.user.id ?? "");
  return new NextResponse(null, { status: 204 });
}
