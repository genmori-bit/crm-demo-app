import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listEmailTemplates, createEmailTemplate } from "@/lib/services/email-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1),
  bodyHtml: z.string().default(""),
  bodyText: z.string().nullable().optional(),
  fromName: z.string().nullable().optional(),
  fromEmail: z.string().nullable().optional(),
  previewText: z.string().nullable().optional(),
  type: z.string().default("regular"),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  return NextResponse.json(await listEmailTemplates(search));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const tpl = await createEmailTemplate(parsed.data, session.user.id ?? "");
  return NextResponse.json(tpl, { status: 201 });
}
