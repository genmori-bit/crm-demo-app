import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const form = await prisma.marketingForm.findUnique({
    where: { id, isActive: true, deletedAt: null },
    select: { id: true, name: true, campaignId: true },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const email: string | undefined = body.email;
  let prospect = null;

  if (email) {
    // Upsert prospect by email
    prospect = await prisma.prospect.upsert({
      where: { email },
      update: {
        firstName: body.firstName ?? body.first_name ?? undefined,
        lastName: body.lastName ?? body.last_name ?? undefined,
        companyName: body.companyName ?? body.company ?? undefined,
        jobTitle: body.jobTitle ?? body.title ?? undefined,
        phone: body.phone ?? undefined,
        lastActivityAt: new Date(),
      },
      create: {
        email,
        firstName: body.firstName ?? body.first_name ?? null,
        lastName: body.lastName ?? body.last_name ?? null,
        companyName: body.companyName ?? body.company ?? null,
        jobTitle: body.jobTitle ?? body.title ?? null,
        phone: body.phone ?? null,
        source: "FORM",
        lastActivityAt: new Date(),
      },
    });

    // Find or create Lead
    let lead = await prisma.lead.findFirst({
      where: { email, deletedAt: null },
    });
    if (!lead) {
      // Only link prospectId if this prospect is not yet tied to another lead
      const prospectAlreadyLinked = await prisma.lead.findFirst({
        where: { prospectId: prospect.id, deletedAt: null },
      });
      lead = await prisma.lead.create({
        data: {
          email,
          fullName: [body.firstName ?? body.first_name, body.lastName ?? body.last_name]
            .filter(Boolean).join(" ") || email,
          companyName: body.companyName ?? body.company ?? null,
          title: body.jobTitle ?? body.title ?? null,
          phone: body.phone ?? null,
          source: "WEB",
          status: "NEW",
          rating: "COLD",
          prospectId: prospectAlreadyLinked ? null : prospect.id,
        },
      });
    }

    // Add to campaign if form is linked to one
    if (form.campaignId) {
      const existing = await prisma.campaignMember.findFirst({
        where: { campaignId: form.campaignId, leadId: lead.id },
      });
      if (!existing) {
        await prisma.campaignMember.create({
          data: {
            campaignId: form.campaignId,
            leadId: lead.id,
            prospectId: prospect.id,
            status: "RESPONDED",
            responded: true,
            firstRespondedAt: new Date(),
          },
        });
      }
    }

    // Record prospect activity
    await prisma.prospectActivity.create({
      data: {
        prospectId: prospect.id,
        type: "FORM_SUBMIT",
        description: `フォーム送信: ${form.name}`,
        metadata: { formId: form.id, formName: form.name },
      },
    });
  }

  // Save form submission record
  await prisma.formSubmission.create({
    data: {
      formId: form.id,
      prospectId: prospect?.id ?? null,
      data: body,
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.json({ ok: true, prospectId: prospect?.id ?? null });
}
