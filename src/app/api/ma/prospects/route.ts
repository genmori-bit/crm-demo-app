import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listProspects, createProspect } from "@/lib/services/prospect-service";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const result = await listProspects({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    grade: sp.get("grade") ?? undefined,
    listId: sp.get("listId") ?? undefined,
    page: Number(sp.get("page") ?? 1),
    limit: Number(sp.get("limit") ?? 50),
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const prospect = await createProspect(parsed.data, session.user.id ?? "");
    return NextResponse.json(prospect, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }
    throw e;
  }
}
