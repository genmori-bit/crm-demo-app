import { prisma } from "./prisma";

export async function addProspectToCampaign(campaignId: string, prospectId: string) {
  const existing = await prisma.campaignMember.findFirst({
    where: { campaignId, prospectId },
  });
  if (existing) return existing;
  return prisma.campaignMember.create({
    data: { campaignId, prospectId, status: "Sent" },
  });
}

export async function addContactToCampaign(campaignId: string, contactId: string) {
  const existing = await prisma.campaignMember.findFirst({
    where: { campaignId, contactId },
  });
  if (existing) return existing;
  return prisma.campaignMember.create({
    data: { campaignId, contactId, status: "Sent" },
  });
}

export async function addLeadToCampaign(campaignId: string, leadId: string) {
  const existing = await prisma.campaignMember.findFirst({
    where: { campaignId, leadId },
  });
  if (existing) return existing;
  return prisma.campaignMember.create({
    data: { campaignId, leadId, status: "Sent" },
  });
}

export async function updateCampaignStats(campaignId: string) {
  const members = await prisma.campaignMember.findMany({ where: { campaignId } });
  const totalMembers = members.length;
  const respondedCount = members.filter((m) => m.responded).length;
  const wonCount = members.filter((m) => m.status === "Won").length;

  console.log(`Campaign ${campaignId}: ${totalMembers} members, ${respondedCount} responded, ${wonCount} won`);
}
