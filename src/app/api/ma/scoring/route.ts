import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(["behavior", "demographic"]).default("behavior"),
  triggerType: z.string(),
  scoreChange: z.number().int(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.scoringRule.findMany({ orderBy: [{ category: "asc" }, { scoreChange: "desc" }] }));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rule = await prisma.scoringRule.create({ data: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
