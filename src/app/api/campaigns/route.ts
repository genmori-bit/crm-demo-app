import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  actualCost: z.number().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  parentCampaignId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "ma.view");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = { deletedAt: null };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const [total, campaigns] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parentCampaign: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    }),
  ]);

  return NextResponse.json({ campaigns, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "ma.view");
  if (denied) return denied;

  const body = await req.json();
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const campaign = await prisma.campaign.create({ data });
  return NextResponse.json(campaign, { status: 201 });
}
