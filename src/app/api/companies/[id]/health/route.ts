import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const snapshots = await prisma.accountHealthSnapshot.findMany({
      where: { companyId: id },
      orderBy: { measuredAt: "desc" },
      take: 30,
    });
    return NextResponse.json(snapshots);
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
    const snapshot = await prisma.accountHealthSnapshot.create({
      data: {
        companyId: id,
        healthScore: body.healthScore,
        fitScore: body.fitScore,
        engagementScore: body.engagementScore,
        riskLevel: body.riskLevel || "LOW",
        reason: body.reason,
        measuredAt: body.measuredAt ? new Date(body.measuredAt) : new Date(),
      },
    });

    // Update company healthScore and lastEngagementAt
    await prisma.company.update({
      where: { id },
      data: {
        healthScore: body.healthScore,
        lastEngagementAt: new Date(),
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
