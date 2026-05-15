import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();

    // Upsert: match on recordPageId + objectApiName + appId + formFactor
    const assignment = await prisma.recordPageAssignment.upsert({
      where: {
        // Use a findFirst + update/create pattern since there's no unique compound on all fields
        // We create a new assignment or update the first matching one
        id: body.assignmentId || "nonexistent",
      },
      create: {
        recordPageId: id,
        objectApiName: body.objectApiName,
        appId: body.appId,
        recordTypeId: body.recordTypeId,
        profileId: body.profileId,
        formFactor: body.formFactor || "BOTH",
        priority: body.priority || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      update: {
        recordPageId: id,
        objectApiName: body.objectApiName,
        appId: body.appId,
        recordTypeId: body.recordTypeId,
        profileId: body.profileId,
        formFactor: body.formFactor || "BOTH",
        priority: body.priority || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
