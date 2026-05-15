import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const schema = z.object({
  objectId: z.string().min(1),
  label: z.string().min(1),
  apiName: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*__c$/, "API名は英数字__cで終わらせてください"),
  fieldType: z.enum(["TEXT", "NUMBER", "DATE", "DATETIME", "BOOLEAN", "PICKLIST", "TEXTAREA", "EMAIL", "PHONE", "URL", "CURRENCY", "LOOKUP"]),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional().nullable(),
  picklistValues: z.array(z.string()).optional(),
  helpText: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const objectId = new URL(req.url).searchParams.get("objectId");
  const where: Record<string, unknown> = { deletedAt: null };
  if (objectId) where.objectDefinitionId = objectId;

  const fields = await prisma.fieldDefinition.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(fields.map((f) => ({
    id: f.id,
    label: f.label,
    apiName: f.apiName,
    fieldType: f.fieldType,
    isRequired: f.isRequired,
    defaultValue: f.defaultValue,
    picklistValues: Array.isArray((f.options as any)?.values) ? (f.options as any).values : [],
    helpText: f.helpText,
    sortOrder: f.sortOrder,
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

  const { objectId, picklistValues, ...data } = parsed.data;

  const field = await prisma.fieldDefinition.create({
    data: {
      ...data,
      objectDefinitionId: objectId,
      options: picklistValues && picklistValues.length > 0 ? { values: picklistValues } : undefined,
    },
  });

  return NextResponse.json({
    id: field.id,
    label: field.label,
    apiName: field.apiName,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    defaultValue: field.defaultValue,
    picklistValues: Array.isArray((field.options as any)?.values) ? (field.options as any).values : [],
    helpText: field.helpText,
    sortOrder: field.sortOrder,
  }, { status: 201 });
}
