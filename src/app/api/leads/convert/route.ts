import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { convertLead } from "@/lib/lead-conversion";
import { z } from "zod";

const schema = z.object({
  leadId: z.string(),
  createCompany: z.boolean().default(true),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  createContact: z.boolean().default(true),
  createDeal: z.boolean().default(false),
  dealName: z.string().optional(),
  dealAmount: z.number().optional(),
  dealStage: z.string().optional(),
  dealCloseDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireRole(session.user as any, "company.create");
  if (denied) return denied;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await convertLead({
      ...parsed.data,
      convertedById: (session.user as any).id,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
