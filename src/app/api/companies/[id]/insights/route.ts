import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const insights = await prisma.accountInsight.findMany({
      where: { companyId: id },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json(insights);
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
    const insight = await prisma.accountInsight.create({
      data: {
        companyId: id,
        type: body.type || "CUSTOM",
        title: body.title,
        body: body.body,
        severity: body.severity || "INFO",
        source: "USER",
        actionLabel: body.actionLabel,
        actionUrl: body.actionUrl,
      },
    });
    return NextResponse.json(insight, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
