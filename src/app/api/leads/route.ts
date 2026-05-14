import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

const leadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().min(1),
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
  prospectId: z.string().optional().nullable(),
  disqualifiedReason: z.string().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.view");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  const where: any = { deletedAt: null };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true } },
        prospect: { select: { id: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.create");
  if (denied) return denied;

  const body = await req.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const lead = await prisma.lead.create({ data: parsed.data as any });
  return NextResponse.json(lead, { status: 201 });
}
