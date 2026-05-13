import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rowSchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().optional(),
  status: z.string().optional(),
  website: z.string().optional(),
  employeeSize: z.string().optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  memo: z.string().optional(),
});

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

  for (let i = 0; i < rows.length; i++) {
    const parsed = rowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({ row: i + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }
    try {
      if (objectType === "company") {
        await prisma.company.create({ data: parsed.data });
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
