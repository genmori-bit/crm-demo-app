import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const plans = await prisma.accountPlan.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const plan = await prisma.accountPlan.create({
      data: {
        companyId: id,
        name: body.name,
        fiscalYear: body.fiscalYear,
        status: body.status || "DRAFT",
        summary: body.summary,
        businessObjectives: body.businessObjectives,
        keyInitiatives: body.keyInitiatives,
        risks: body.risks,
        expansionOpportunities: body.expansionOpportunities,
        nextActions: body.nextActions,
        ownerId: body.ownerId,
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
