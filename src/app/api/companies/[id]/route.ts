import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validations/company";
import { createAuditLog } from "@/lib/services/audit-log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [company, rollup] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }] },
        deals: {
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { id: true, name: true, department: true } },
            salesRep: { select: { id: true, name: true } },
          },
        },
        activities: {
          orderBy: { activityDate: "desc" },
          include: {
            contact: { select: { id: true, fullName: true } },
            owner: { select: { id: true, name: true } },
            deal: { select: { id: true, dealName: true } },
          },
          take: 30,
        },
        tasks: {
          where: { status: { not: "done" } },
          orderBy: { dueDate: "asc" },
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
        accountTeamMembers: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true, department: true, title: true, phone: true,
              },
            },
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        accountInsights: {
          where: { isDismissed: false },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        accountPlans: {
          where: { status: "ACTIVE" },
          take: 3,
        },
        sourceRelationships: {
          include: { targetCompany: { select: { id: true, companyName: true } } },
          take: 10,
        },
        targetRelationships: {
          include: { sourceCompany: { select: { id: true, companyName: true } } },
          take: 10,
        },
        accountStakeholders: {
          include: { contact: { select: { id: true, fullName: true, email: true, title: true } } },
          take: 10,
        },
        accountHealthSnapshots: {
          orderBy: { measuredAt: "desc" },
          take: 1,
        },
        childCompanies: {
          select: { id: true, companyName: true, tier: true, status: true },
          take: 10,
        },
        parentCompany: {
          select: { id: true, companyName: true },
        },
      },
    }),
    Promise.all([
      prisma.contact.count({ where: { companyId: id } }),
      prisma.deal.count({ where: { companyId: id, stage: { notIn: ["won", "lost"] } } }),
      prisma.deal.aggregate({ where: { companyId: id, stage: { notIn: ["won", "lost"] } }, _sum: { amount: true } }),
      prisma.deal.aggregate({ where: { companyId: id, stage: "won" }, _sum: { amount: true } }),
      prisma.case.count({ where: { companyId: id, status: { notIn: ["Closed"] } } }),
      prisma.contract.count({ where: { companyId: id, status: "Active" } }),
      prisma.lead.count({ where: { companyId: id, score: { gte: 70 }, convertedAt: null } }),
    ]),
  ]);

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [
    contactsCount,
    openDealsCount,
    openPipelineResult,
    wonAmountResult,
    activeCasesCount,
    activeContractsCount,
    highScoreLeadsCount,
  ] = rollup;

  return NextResponse.json({
    ...company,
    _rollup: {
      contactsCount,
      openDealsCount,
      openPipelineAmount: openPipelineResult._sum.amount ?? 0,
      wonAmount: wonAmountResult._sum.amount ?? 0,
      activeCasesCount,
      activeContractsCount,
      highScoreLeadsCount,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const before = await prisma.company.findUnique({ where: { id } });
  const body = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const company = await prisma.company.update({ where: { id }, data: parsed.data });
  await createAuditLog({ userId: session.user?.id, objectType: "Company", objectId: id, action: "UPDATE", before: before as Record<string, unknown>, after: company as Record<string, unknown> });
  return NextResponse.json(company);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const before = await prisma.company.findUnique({ where: { id } });
  await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId: session.user?.id, objectType: "Company", objectId: id, action: "DELETE", before: before as Record<string, unknown> });
  return NextResponse.json({ success: true });
}
