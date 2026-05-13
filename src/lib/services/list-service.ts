import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit-log";

export async function listMarketingLists(search?: string) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (search) where.name = { contains: search, mode: "insensitive" };
  return prisma.marketingList.findMany({
    where,
    include: { _count: { select: { memberships: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getMarketingList(id: string) {
  return prisma.marketingList.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        include: { prospect: { select: { id: true, email: true, firstName: true, lastName: true, company: true, score: true, grade: true } } },
        orderBy: { addedAt: "desc" },
        take: 100,
      },
    },
  });
}

export async function createMarketingList(data: {
  name: string;
  description?: string | null;
  type?: string;
  isPublic?: boolean;
}, userId: string) {
  const list = await prisma.marketingList.create({ data: { ...data, createdById: userId } });
  await createAuditLog({ userId, objectType: "MarketingList", objectId: list.id, action: "CREATE", after: data as Record<string, unknown> });
  return list;
}

export async function updateMarketingList(id: string, data: Partial<{
  name: string;
  description: string | null;
  isPublic: boolean;
}>, userId: string) {
  const list = await prisma.marketingList.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "MarketingList", objectId: id, action: "UPDATE", after: data as Record<string, unknown> });
  return list;
}

export async function deleteMarketingList(id: string, userId: string) {
  await prisma.marketingList.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId, objectType: "MarketingList", objectId: id, action: "DELETE" });
}

export async function addProspectToList(listId: string, prospectId: string, addedBy = "manual") {
  return prisma.marketingListMembership.upsert({
    where: { listId_prospectId: { listId, prospectId } },
    create: { listId, prospectId, addedBy },
    update: {},
  });
}

export async function removeProspectFromList(listId: string, prospectId: string) {
  return prisma.marketingListMembership.delete({
    where: { listId_prospectId: { listId, prospectId } },
  });
}
