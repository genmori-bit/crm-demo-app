import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/contact";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const companyId = searchParams.get("companyId") ?? "";

  const contacts = await prisma.contact.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { fullName: { contains: query } },
                { email: { contains: query } },
                { department: { contains: query } },
              ],
            }
          : {},
        companyId ? { companyId } : {},
      ],
    },
    include: {
      company: { select: { companyName: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: parsed.data,
    include: { company: { select: { companyName: true } } },
  });
  return NextResponse.json(contact, { status: 201 });
}
