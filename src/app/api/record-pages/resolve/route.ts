import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const objectApiName = searchParams.get("objectApiName");
  const appId = searchParams.get("appId") ?? undefined;
  const formFactor = searchParams.get("formFactor") ?? undefined;

  if (!objectApiName) {
    return NextResponse.json({ error: "objectApiName is required" }, { status: 400 });
  }

  try {
    // Try to find the best assignment match
    let resolvedPageId: string | null = null;

    if (appId) {
      // Try app-specific assignment first
      const assignment = await prisma.recordPageAssignment.findFirst({
        where: {
          objectApiName,
          appId,
          isActive: true,
          ...(formFactor ? { formFactor: { in: [formFactor, "BOTH"] } } : {}),
        },
        orderBy: { priority: "desc" },
      });
      if (assignment) resolvedPageId = assignment.recordPageId;
    }

    if (!resolvedPageId) {
      // Try app default (no recordTypeId or profileId filter)
      const assignment = await prisma.recordPageAssignment.findFirst({
        where: {
          objectApiName,
          isActive: true,
          ...(formFactor ? { formFactor: { in: [formFactor, "BOTH"] } } : {}),
        },
        orderBy: { priority: "desc" },
      });
      if (assignment) resolvedPageId = assignment.recordPageId;
    }

    // Resolve priority: appId+specific > app default > isDefault > first active
    const page = resolvedPageId
      ? await prisma.recordPageDefinition.findFirst({
          where: { id: resolvedPageId, status: "ACTIVE", deletedAt: null },
          include: { components: { orderBy: [{ region: "asc" }, { sortOrder: "asc" }] } },
        })
      : await prisma.recordPageDefinition.findFirst({
          where: { objectApiName, status: "ACTIVE", deletedAt: null },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          include: { components: { orderBy: [{ region: "asc" }, { sortOrder: "asc" }] } },
        });

    if (!page) return NextResponse.json({ error: "No active page found" }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
