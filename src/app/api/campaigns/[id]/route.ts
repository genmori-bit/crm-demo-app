import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id, deletedAt: null },
    include: {
      parentCampaign: { select: { id: true, name: true } },
      childCampaigns: { select: { id: true, name: true, status: true } },
      members: {
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          prospect: { select: { id: true, email: true, firstName: true, lastName: true } },
          contact: { select: { id: true, fullName: true, email: true } },
          lead: { select: { id: true, fullName: true, email: true } },
        },
      },
      influences: {
        include: { deal: { select: { id: true, dealName: true, amount: true, stage: true } } },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "ma.view");
  if (denied) return denied;
  const { id } = await params;

  const body = await req.json();
  const data: any = { ...body };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const campaign = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json(campaign);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "ma.view");
  if (denied) return denied;
  const { id } = await params;

  await prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
