import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  bodyHtml: z.string().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDesc: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const page = await prisma.landingPage.findFirst({ where: { id, deletedAt: null } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = { ...parsed.data, updatedAt: new Date() } as Record<string, unknown>;
  if (parsed.data.status === "published") data.publishedAt = new Date();
  const page = await prisma.landingPage.update({ where: { id }, data });
  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.landingPage.update({ where: { id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
}
