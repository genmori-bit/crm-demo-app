import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const relationships = await prisma.accountRelationship.findMany({
      where: {
        OR: [{ sourceCompanyId: id }, { targetCompanyId: id }],
      },
      include: {
        sourceCompany: { select: { id: true, companyName: true, tier: true, status: true, industry: true } },
        targetCompany: { select: { id: true, companyName: true, tier: true, status: true, industry: true } },
      },
    });
    return NextResponse.json(relationships);
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
    const relationship = await prisma.accountRelationship.create({
      data: {
        sourceCompanyId: id,
        targetCompanyId: body.targetCompanyId,
        relationshipType: body.relationshipType || "RELATED",
        description: body.description,
      },
      include: {
        sourceCompany: { select: { id: true, companyName: true, tier: true, status: true, industry: true } },
        targetCompany: { select: { id: true, companyName: true, tier: true, status: true, industry: true } },
      },
    });
    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
