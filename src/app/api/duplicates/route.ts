import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDuplicateCandidates } from "@/lib/services/data-quality";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await getDuplicateCandidates();
  return NextResponse.json(groups);
}
