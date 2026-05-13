import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit-log";

export async function listForms() {
  return prisma.marketingForm.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { submissions: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getForm(id: string) {
  return prisma.marketingForm.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { submissions: true } },
      submissions: {
        include: { prospect: { select: { id: true, email: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
      handlers: true,
    },
  });
}

export async function createForm(data: {
  name: string;
  description?: string | null;
  fields: unknown[];
  thankYouMsg?: string | null;
  redirectUrl?: string | null;
}, userId: string) {
  const form = await prisma.marketingForm.create({
    data: {
      name: data.name,
      description: data.description,
      fields: data.fields as object[],
      thankYouMsg: data.thankYouMsg,
      redirectUrl: data.redirectUrl,
      createdById: userId,
    },
  });
  await createAuditLog({ userId, objectType: "MarketingForm", objectId: form.id, action: "CREATE", after: { name: data.name } });
  return form;
}

export async function updateForm(id: string, data: Partial<{
  name: string;
  description: string | null;
  fields: unknown[];
  thankYouMsg: string | null;
  redirectUrl: string | null;
  isActive: boolean;
}>, userId: string) {
  const form = await prisma.marketingForm.update({
    where: { id },
    data: { ...data, fields: data.fields as object[] | undefined, updatedAt: new Date() },
  });
  await createAuditLog({ userId, objectType: "MarketingForm", objectId: id, action: "UPDATE", after: data as Record<string, unknown> });
  return form;
}

export async function deleteForm(id: string, userId: string) {
  await prisma.marketingForm.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId, objectType: "MarketingForm", objectId: id, action: "DELETE" });
}
