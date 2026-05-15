import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ objectApiName: string }> };

// Map standard apiName to Prisma count query
async function getStandardRecordCount(apiName: string): Promise<number | null> {
  try {
    const modelMap: Record<string, () => Promise<number>> = {
      Account: () => prisma.company.count({ where: { deletedAt: null } }),
      Contact: () => prisma.contact.count({ where: { deletedAt: null } }),
      Lead: () => prisma.lead.count({ where: { deletedAt: null } }),
      Deal: () => prisma.deal.count({ where: { deletedAt: null } }),
      Opportunity: () => prisma.deal.count({ where: { deletedAt: null } }),
      Campaign: () => prisma.campaign.count({ where: { deletedAt: null } }),
      Case: () => prisma.case.count({ where: { deletedAt: null } }),
      Product: () => prisma.product.count({ where: { deletedAt: null } }),
      Task: () => prisma.task.count(),
      Activity: () => prisma.activity.count(),
      MarketingEmail: () => prisma.marketingEmail.count({ where: { deletedAt: null } }),
      MarketingForm: () => prisma.marketingForm.count({ where: { deletedAt: null } }),
      EngagementProgram: () => prisma.engagementProgram.count({ where: { deletedAt: null } }),
    };
    const fn = modelMap[apiName];
    if (!fn) return null;
    return await fn();
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { objectApiName } = await params;

  const objectDef = await prisma.objectDefinition.findUnique({
    where: { apiName: objectApiName, deletedAt: null },
    include: {
      fields: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { fields: true, records: true } },
    },
  });

  if (!objectDef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStandard = objectDef.objectType === "STANDARD";
  const recordCount = isStandard
    ? await getStandardRecordCount(objectApiName)
    : objectDef._count.records;

  return NextResponse.json({
    id: objectDef.id,
    label: objectDef.label,
    labelPlural: objectDef.pluralLabel,
    apiName: objectDef.apiName,
    description: objectDef.description,
    objectType: objectDef.objectType,
    category: objectDef.category,
    isCustom: objectDef.objectType === "CUSTOM",
    isActive: objectDef.isActive,
    isSearchable: objectDef.isSearchable,
    isReportable: objectDef.isReportable,
    isAuditable: objectDef.isAuditable,
    enableActivities: objectDef.enableActivities,
    enableNotes: objectDef.enableNotes,
    enableFiles: objectDef.enableFiles,
    enableHistory: objectDef.enableHistory,
    createdAt: objectDef.createdAt,
    fieldCount: objectDef._count.fields,
    recordCount,
    fields: objectDef.fields.map((f) => ({
      id: f.id,
      label: f.label,
      apiName: f.apiName,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
      isUnique: f.isUnique,
      isSystem: f.isSystem,
      defaultValue: f.defaultValue,
      picklistValues: Array.isArray((f.options as any)?.values) ? (f.options as any).values : [],
      helpText: f.helpText,
      sortOrder: f.sortOrder,
    })),
  });
}
