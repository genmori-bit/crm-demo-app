import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from "@/lib/services/email-service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().nullable().optional(),
  fromName: z.string().nullable().optional(),
  fromEmail: z.string().nullable().optional(),
  previewText: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tpl = await getEmailTemplate(id);
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tpl);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const tpl = await updateEmailTemplate(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(tpl);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteEmailTemplate(id, session.user.id ?? "");
  return new NextResponse(null, { status: 204 });
}
