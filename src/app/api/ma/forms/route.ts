import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listForms, createForm } from "@/lib/services/form-service";
import { z } from "zod";

const fieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  name: z.string(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  fields: z.array(fieldSchema).default([]),
  thankYouMsg: z.string().nullable().optional(),
  redirectUrl: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listForms());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const form = await createForm(parsed.data, session.user.id ?? "");
  return NextResponse.json(form, { status: 201 });
}
