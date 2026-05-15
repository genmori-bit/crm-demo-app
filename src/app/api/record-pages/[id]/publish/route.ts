import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const page = await prisma.recordPageDefinition.findFirst({
      where: { id, deletedAt: null },
    });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newVersion = page.version + 1;

    const [updatedPage, version] = await Promise.all([
      prisma.recordPageDefinition.update({
        where: { id },
        data: { status: "ACTIVE", version: newVersion, updatedById: session.user?.id },
      }),
      prisma.recordPageVersion.create({
        data: {
          recordPageId: id,
          version: newVersion,
          layout: page.layout as object,
          publishedById: session.user?.id,
          publishedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ page: updatedPage, version });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
