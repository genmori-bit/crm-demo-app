import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const companySchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  status: z.string().optional(),
  website: z.string().optional(),
  employeeSize: z.string().optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  memo: z.string().optional(),
});

const leadSchema = z.object({
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  rating: z.string().optional(),
}).transform((d) => ({
  ...d,
  fullName: d.fullName || [d.lastName, d.firstName].filter(Boolean).join(" ") || d.email || "Unknown",
  email: d.email || null,
  phone: d.phone || null,
  companyName: d.companyName || null,
}));

const caseSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  origin: z.string().optional(),
}).transform((d) => ({
  ...d,
  description: d.description || null,
  type: d.type || null,
  origin: d.origin || null,
}));

const contactSchema = z.object({
  fullName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
}).transform((d) => ({
  ...d,
  fullName: d.fullName || [d.lastName, d.firstName].filter(Boolean).join(" ") || d.email || "Unknown",
}));

const rowSchema = companySchema;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { objectType, fileName, rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const job = await prisma.importJob.create({
    data: {
      objectType,
      fileName,
      status: "processing",
      totalRows: rows.length,
      createdById: session.user?.id,
    },
  });

  let importedRows = 0;
  const errors: { row: number; message: string }[] = [];

  const schemaByType: Record<string, z.ZodTypeAny> = {
    company: companySchema,
    lead: leadSchema,
    case: caseSchema,
    contact: contactSchema,
  };
  const schema = schemaByType[objectType] ?? companySchema;

  for (let i = 0; i < rows.length; i++) {
    const parsed = schema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({ row: i + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }
    try {
      if (objectType === "company") {
        await prisma.company.create({ data: parsed.data as any });
      } else if (objectType === "lead") {
        await prisma.lead.create({ data: parsed.data as any });
      } else if (objectType === "case") {
        await prisma.case.create({ data: parsed.data as any });
      } else if (objectType === "contact") {
        const d = parsed.data as any;
        if (!d.companyId) {
          errors.push({ row: i + 1, message: "companyIdが必要です" });
          continue;
        }
        await prisma.contact.create({ data: d });
      }
      importedRows++;
    } catch (e) {
      errors.push({ row: i + 1, message: String(e) });
    }
  }

  const updatedJob = await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: errors.length === rows.length ? "failed" : "completed",
      importedRows,
      errorRows: errors.length,
      errors,
      completedAt: new Date(),
    },
  });

  return NextResponse.json(updatedJob);
}
