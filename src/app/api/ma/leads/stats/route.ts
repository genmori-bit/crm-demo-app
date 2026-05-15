import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [total, active, converted, optedOut, mql, avgScoreResult] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null, status: { notIn: ["CONVERTED", "UNSUBSCRIBED"] }, optedOut: false } }),
    prisma.lead.count({ where: { deletedAt: null, status: "CONVERTED" } }),
    prisma.lead.count({ where: { deletedAt: null, optedOut: true } }),
    prisma.lead.count({ where: { deletedAt: null, lifecycleStage: "MQL" } }),
    prisma.lead.aggregate({ _avg: { score: true }, where: { deletedAt: null } }),
  ]);

  return NextResponse.json({
    total,
    active,
    converted,
    optedOut,
    mql,
    avgScore: Math.round(avgScoreResult._avg.score ?? 0),
  });
}
