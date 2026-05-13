import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getForm, updateForm, deleteForm } from "@/lib/services/form-service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  fields: z.array(z.unknown()).optional(),
  thankYouMsg: z.string().nullable().optional(),
  redirectUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const form = await updateForm(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(form);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteForm(id, session.user.id ?? "");
  return new NextResponse(null, { status: 204 });
}
