import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailStats } from "@/lib/services/email-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getEmailStats());
}
