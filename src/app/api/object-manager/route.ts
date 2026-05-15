import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  label: z.string().min(1),
  labelPlural: z.string().min(1),
  apiName: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*__c$/, "API名は英数字アンダースコアで終わり__cを付けてください"),
  description: z.string().optional().nullable(),
  icon: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const objects = await prisma.objectDefinition.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { fields: true, records: true } },
    },
  });

  // Normalize to UI-friendly shape
  return NextResponse.json(objects.map((o) => ({
    id: o.id,
    label: o.label,
    labelPlural: o.pluralLabel,
    apiName: o.apiName,
    description: o.description,
    isCustom: o.objectType === "CUSTOM",
    isActive: o.isActive,
    createdAt: o.createdAt,
    _count: o._count,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireAdmin(session.user as any);
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await prisma.objectDefinition.findUnique({ where: { apiName: parsed.data.apiName } });
  if (exists) return NextResponse.json({ error: "このAPI名はすでに使用されています" }, { status: 409 });

  const { labelPlural, ...rest } = parsed.data;
  const obj = await prisma.objectDefinition.create({
    data: {
      ...rest,
      pluralLabel: labelPlural,
      objectType: "CUSTOM",
      category: "CUSTOM",
      isActive: true,
      createdById: (session.user as any).id,
    },
  });

  return NextResponse.json({
    id: obj.id,
    label: obj.label,
    labelPlural: obj.pluralLabel,
    apiName: obj.apiName,
    description: obj.description,
    isCustom: true,
    isActive: obj.isActive,
    createdAt: obj.createdAt,
  }, { status: 201 });
}
