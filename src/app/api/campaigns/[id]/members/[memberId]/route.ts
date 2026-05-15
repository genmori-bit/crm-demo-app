import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  const body = await req.json();

  const member = await prisma.campaignMember.updateMany({
    where: { id: memberId, campaignId: id },
    data: {
      status:           body.status           ?? undefined,
      responded:        body.responded        ?? undefined,
      firstRespondedAt: body.responded === true ? new Date() : undefined,
    },
  });

  return NextResponse.json(member);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
  await prisma.campaignMember.deleteMany({ where: { id: memberId, campaignId: id } });
  return NextResponse.json({ ok: true });
}
