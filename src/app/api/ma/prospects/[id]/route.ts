import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProspect, updateProspect, deleteProspect } from "@/lib/services/prospect-service";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  status: z.string().optional(),
  doNotEmail: z.boolean().optional(),
  optedOut: z.boolean().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const prospect = await updateProspect(id, parsed.data, session.user.id ?? "");
  return NextResponse.json(prospect);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteProspect(id, session.user.id ?? "");
  return new NextResponse(null, { status: 204 });
}
