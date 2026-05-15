import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const files = await prisma.fileAttachment.findMany({
    where: { companyId: id },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      description: true,
      uploadedById: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const description = formData.get("description") as string | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは10MB以下にしてください" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const attachment = await prisma.fileAttachment.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      data: buffer,
      companyId: id,
      description: description ?? null,
    },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
