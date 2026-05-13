import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { globalSearch } from "@/lib/services/search";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return NextResponse.json(results);
}
