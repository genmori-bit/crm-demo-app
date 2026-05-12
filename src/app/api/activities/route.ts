import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activitySchema } from "@/lib/validations/activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") ?? "";
  const contactId = searchParams.get("contactId") ?? "";
  const dealId = searchParams.get("dealId") ?? "";

  const activities = await prisma.activity.findMany({
    where: {
      AND: [
        companyId ? { companyId } : {},
        contactId ? { contactId } : {},
        dealId ? { dealId } : {},
      ],
    },
    include: {
      company: { select: { companyName: true } },
      contact: { select: { fullName: true } },
      deal: { select: { dealName: true } },
    },
    orderBy: { activityDate: "desc" },
  });

  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { activityDate, companyId, contactId, dealId, ...rest } = parsed.data;
  const activity = await prisma.activity.create({
    data: {
      ...rest,
      companyId: companyId || null,
      contactId: contactId || null,
      dealId: dealId || null,
      activityDate: new Date(activityDate),
    },
    include: {
      company: { select: { companyName: true } },
      contact: { select: { fullName: true } },
      deal: { select: { dealName: true } },
    },
  });
  return NextResponse.json(activity, { status: 201 });
}
