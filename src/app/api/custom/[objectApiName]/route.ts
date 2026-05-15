import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ objectApiName: string }> };

async function resolveObject(apiName: string) {
  return prisma.objectDefinition.findUnique({ where: { apiName, deletedAt: null } });
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { objectApiName } = await params;

  const objectDef = await resolveObject(objectApiName);
  if (!objectDef) return NextResponse.json({ error: "Object not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { objectDefinitionId: objectDef.id, deletedAt: null };
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [total, records] = await Promise.all([
    prisma.customObjectRecord.count({ where }),
    prisma.customObjectRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    objectDef: {
      id: objectDef.id,
      label: objectDef.label,
      labelPlural: objectDef.pluralLabel,
      apiName: objectDef.apiName,
      description: objectDef.description,
    },
    records,
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { objectApiName } = await params;

  const objectDef = await resolveObject(objectApiName);
  if (!objectDef) return NextResponse.json({ error: "Object not found" }, { status: 404 });

  const body = await req.json();
  const { name, ...values } = body;

  const record = await prisma.customObjectRecord.create({
    data: {
      objectDefinitionId: objectDef.id,
      name: name ?? "新しいレコード",
      values: values ?? {},
      createdById: (session.user as any).id,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
