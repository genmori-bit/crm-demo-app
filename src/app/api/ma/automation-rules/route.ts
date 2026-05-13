import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  triggerType: z.string(),
  triggerConf: z.record(z.unknown()).default({}),
  conditions: z.array(z.unknown()).default([]),
  actions: z.array(z.unknown()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await prisma.automationRule.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rule = await prisma.automationRule.create({
    data: {
      ...parsed.data,
      triggerConf: parsed.data.triggerConf as object,
      conditions: parsed.data.conditions as object[],
      actions: parsed.data.actions as object[],
      createdById: session.user.id,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
