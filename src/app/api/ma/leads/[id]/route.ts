import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      engagementActivities: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      listMemberships: {
        include: { list: { select: { id: true, name: true } } },
      },
      emailRecipients: {
        include: { email: { select: { id: true, name: true, subject: true, sentAt: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      formSubmissions: {
        include: { form: { select: { id: true, name: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
      programEnrollments: {
        include: { program: { select: { id: true, name: true } } },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
