import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ objectApiName: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { objectApiName, id } = await params;

  const objectDef = await prisma.objectDefinition.findUnique({ where: { apiName: objectApiName } });
  if (!objectDef) return NextResponse.json({ error: "Object not found" }, { status: 404 });

  const record = await prisma.customObjectRecord.findFirst({
    where: { id, objectDefinitionId: objectDef.id, deletedAt: null },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    objectDef: {
      id: objectDef.id,
      label: objectDef.label,
      labelPlural: objectDef.pluralLabel,
      apiName: objectDef.apiName,
    },
    record,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { objectApiName, id } = await params;

  const objectDef = await prisma.objectDefinition.findUnique({ where: { apiName: objectApiName } });
  if (!objectDef) return NextResponse.json({ error: "Object not found" }, { status: 404 });

  const body = await req.json();
  const { name, ...values } = body;

  const record = await prisma.customObjectRecord.update({
    where: { id },
    data: { name, values, updatedById: (session.user as any).id },
  });
  return NextResponse.json(record);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.customObjectRecord.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
