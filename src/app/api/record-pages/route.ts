import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const objectApiName = searchParams.get("objectApiName") ?? undefined;

  try {
    const pages = await prisma.recordPageDefinition.findMany({
      where: {
        deletedAt: null,
        ...(objectApiName ? { objectApiName } : {}),
      },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const page = await prisma.recordPageDefinition.create({
      data: {
        objectApiName: body.objectApiName,
        apiName: body.apiName,
        label: body.label,
        description: body.description,
        pageType: body.pageType || "RECORD_PAGE",
        template: body.template || "TABS_WITH_RIGHT_SIDEBAR",
        status: body.status || "DRAFT",
        layout: body.layout || {},
        isDefault: body.isDefault || false,
        createdById: session.user?.id,
        updatedById: session.user?.id,
      },
    });
    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
