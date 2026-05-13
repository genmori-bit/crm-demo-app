import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMarketingEmail, updateMarketingEmail, sendMarketingEmail } from "@/lib/services/email-service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().nullable().optional(),
  listId: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional().transform((v) => (v ? new Date(v) : null)),
  status: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const email = await getMarketingEmail(id);
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(email);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  if (body.action === "send") {
    const result = await sendMarketingEmail(id, session.user.id ?? "");
    return NextResponse.json(result);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const email = await updateMarketingEmail(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(email);
}
