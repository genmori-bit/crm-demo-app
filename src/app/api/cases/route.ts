import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { z } from "zod";

const caseSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  origin: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  resolvedAt: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.view");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = { deletedAt: null };
  if (q) where.subject = { contains: q, mode: "insensitive" };
  if (status) where.status = status;

  const [total, cases] = await Promise.all([
    prisma.case.count({ where }),
    prisma.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true } },
        contact: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  return NextResponse.json({ cases, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.create");
  if (denied) return denied;

  const body = await req.json();
  const parsed = caseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.resolvedAt) data.resolvedAt = new Date(data.resolvedAt);

  const caseRecord = await prisma.case.create({ data });
  return NextResponse.json(caseRecord, { status: 201 });
}
