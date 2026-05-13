import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "スラッグは英小文字・数字・ハイフンのみ使用可能です"),
  description: z.string().nullable().optional(),
  bodyHtml: z.string().default(""),
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await prisma.landingPage.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(pages);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const page = await prisma.landingPage.create({ data: { ...parsed.data, createdById: session.user.id } });
    return NextResponse.json(page, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") return NextResponse.json({ error: "このスラッグは既に使用されています" }, { status: 409 });
    throw e;
  }
}
