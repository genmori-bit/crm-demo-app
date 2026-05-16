import { prisma } from "./prisma";

export interface LeadConversionInput {
  leadId: string;
  convertedById: string;
  createCompany: boolean;
  companyId?: string;
  companyName?: string;
  createContact: boolean;
  createDeal: boolean;
  dealName?: string;
  dealAmount?: number;
  dealStage?: string;
  dealCloseDate?: string;
}

export interface LeadConversionResult {
  companyId: string;
  contactId: string;
  dealId?: string;
}

export async function convertLead(input: LeadConversionInput): Promise<LeadConversionResult> {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: input.leadId } });

  if (lead.convertedAt) {
    throw new Error("このリードはすでに変換済みです");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Company
    let companyId = input.companyId ?? "";
    if (input.createCompany) {
      const company = await tx.company.create({
        data: {
          companyName: input.companyName ?? lead.companyName ?? lead.fullName,
          industry: lead.industry ?? undefined,
          phone: lead.phone ?? undefined,
          website: lead.website ?? undefined,
          source: lead.source ?? undefined,
          ownerId: input.convertedById,
        },
      });
      companyId = company.id;
    }

    // 2. Contact
    const contact = await tx.contact.create({
      data: {
        companyId,
        firstName: lead.firstName ?? undefined,
        lastName: lead.lastName ?? lead.fullName,
        fullName: lead.fullName,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        mobilePhone: lead.mobilePhone ?? undefined,
        title: lead.title ?? undefined,
        leadSource: lead.source ?? undefined,
        ownerId: input.convertedById,
      },
    });

    // 3. Deal (optional)
    let dealId: string | undefined;
    if (input.createDeal) {
      const deal = await tx.deal.create({
        data: {
          dealName: input.dealName ?? `${lead.fullName} - 商談`,
          companyId,
          amount: input.dealAmount ?? 0,
          stage: input.dealStage ?? "qualification",
          expectedCloseDate: input.dealCloseDate ? new Date(input.dealCloseDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          leadSource: lead.source ?? undefined,
          ownerId: input.convertedById,
        },
      });
      dealId = deal.id;
    }

    // 4. Mark lead as converted
    await tx.lead.update({
      where: { id: input.leadId },
      data: {
        convertedAt: new Date(),
        convertedAccountId: companyId,
        convertedContactId: contact.id,
        convertedDealId: dealId,
        status: "CONVERTED",
      },
    });

    // 5. Link prospect if any
    if (lead.prospectId) {
      await tx.prospect.update({
        where: { id: lead.prospectId },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          crmContactId: contact.id,
        },
      }).catch(() => {/* ignore if prospect not found */});
    }

    return { companyId, contactId: contact.id, dealId };
  });
}
