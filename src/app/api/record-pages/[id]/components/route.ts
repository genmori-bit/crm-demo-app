import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const components = await prisma.pageComponentInstance.findMany({
      where: { recordPageId: id },
      orderBy: [{ region: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(components);
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
    const component = await prisma.pageComponentInstance.create({
      data: {
        recordPageId: id,
        componentType: body.componentType,
        region: body.region || "main",
        sortOrder: body.sortOrder || 0,
        config: body.config || {},
        visibilityRules: body.visibilityRules,
      },
    });
    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
