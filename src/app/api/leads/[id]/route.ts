import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobilePhone: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.string().optional(),
  rating: z.string().optional(),
  score: z.number().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  disqualifiedReason: z.string().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, companyName: true } },
      prospect: { select: { id: true, email: true, firstName: true, lastName: true } },
      activities: { orderBy: { activityDate: "desc" }, take: 10 },
      tasks: { where: { status: { not: "done" } }, orderBy: { dueDate: "asc" }, take: 10 },
      campaignMembers: { include: { campaign: { select: { id: true, name: true } } } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.edit");
  if (denied) return denied;
  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const lead = await prisma.lead.update({
    where: { id },
    data: parsed.data as any,
  });
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.delete");
  if (denied) return denied;
  const { id } = await params;

  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
