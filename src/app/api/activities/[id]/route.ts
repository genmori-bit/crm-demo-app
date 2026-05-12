import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activitySchema } from "@/lib/validations/activity";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { activityDate, companyId, contactId, dealId, ...rest } = parsed.data;
  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...rest,
      companyId: companyId || null,
      contactId: contactId || null,
      dealId: dealId || null,
      activityDate: new Date(activityDate),
    },
  });
  return NextResponse.json(activity);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
