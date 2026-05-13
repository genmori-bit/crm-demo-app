import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMarketingLists, createMarketingList } from "@/lib/services/list-service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  type: z.enum(["static", "dynamic"]).default("static"),
  isPublic: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  return NextResponse.json(await listMarketingLists(search));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const list = await createMarketingList(parsed.data, session.user.id ?? "");
  return NextResponse.json(list, { status: 201 });
}
