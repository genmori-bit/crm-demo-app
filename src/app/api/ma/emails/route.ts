import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMarketingEmails, createMarketingEmail } from "@/lib/services/email-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  bodyHtml: z.string().default(""),
  bodyText: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  listId: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional().transform((v) => (v ? new Date(v) : null)),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(request.url).searchParams;
  const result = await listMarketingEmails({
    status: sp.get("status") ?? undefined,
    page: Number(sp.get("page") ?? 1),
    limit: Number(sp.get("limit") ?? 20),
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const email = await createMarketingEmail(parsed.data, session.user.id ?? "");
  return NextResponse.json(email, { status: 201 });
}
