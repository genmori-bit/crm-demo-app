import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit-log";

export async function listEmailTemplates(search?: string) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (search) where.name = { contains: search, mode: "insensitive" };
  return prisma.emailTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });
}

export async function getEmailTemplate(id: string) {
  return prisma.emailTemplate.findFirst({ where: { id, deletedAt: null } });
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  previewText?: string | null;
  type?: string;
}, userId: string) {
  const tpl = await prisma.emailTemplate.create({ data: { ...data, createdById: userId } });
  await createAuditLog({ userId, objectType: "EmailTemplate", objectId: tpl.id, action: "CREATE", after: data as Record<string, unknown> });
  return tpl;
}

export async function updateEmailTemplate(id: string, data: Partial<{
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  fromName: string | null;
  fromEmail: string | null;
  previewText: string | null;
}>, userId: string) {
  const tpl = await prisma.emailTemplate.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "EmailTemplate", objectId: id, action: "UPDATE", after: data as Record<string, unknown> });
  return tpl;
}

export async function deleteEmailTemplate(id: string, userId: string) {
  await prisma.emailTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId, objectType: "EmailTemplate", objectId: id, action: "DELETE" });
}

export async function listMarketingEmails(opts: { status?: string; page?: number; limit?: number }) {
  const { status, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = { deletedAt: null };
  if (status) where.status = status;
  const [total, emails] = await Promise.all([
    prisma.marketingEmail.count({ where }),
    prisma.marketingEmail.findMany({
      where,
      include: { list: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { emails, total, page, limit };
}

export async function getMarketingEmail(id: string) {
  return prisma.marketingEmail.findFirst({
    where: { id, deletedAt: null },
    include: {
      template: { select: { id: true, name: true } },
      list: { select: { id: true, name: true } },
      recipients: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createMarketingEmail(data: {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText?: string | null;
  templateId?: string | null;
  listId?: string | null;
  scheduledAt?: Date | null;
}, userId: string) {
  const email = await prisma.marketingEmail.create({ data: { ...data, createdById: userId } });
  await createAuditLog({ userId, objectType: "MarketingEmail", objectId: email.id, action: "CREATE", after: data as Record<string, unknown> });
  return email;
}

export async function updateMarketingEmail(id: string, data: Partial<{
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  bodyText: string | null;
  listId: string | null;
  scheduledAt: Date | null;
  status: string;
}>, userId: string) {
  const email = await prisma.marketingEmail.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "MarketingEmail", objectId: id, action: "UPDATE", after: data as Record<string, unknown> });
  return email;
}

export async function sendMarketingEmail(id: string, userId: string) {
  const email = await prisma.marketingEmail.findUnique({
    where: { id },
    include: { list: { include: { memberships: { include: { prospect: true } } } } },
  });
  if (!email || !email.list) throw new Error("Email or list not found");

  const prospects = email.list.memberships
    .map((m) => m.prospect)
    .filter((p) => !p.doNotEmail && !p.optedOut && !p.emailBounced && p.status === "active");

  await prisma.$transaction([
    prisma.marketingEmail.update({
      where: { id },
      data: { status: "sending", sentAt: new Date(), totalSent: prospects.length },
    }),
    ...prospects.map((p) =>
      prisma.emailRecipient.create({
        data: { emailId: id, prospectId: p.id, status: "sent", sentAt: new Date() },
      })
    ),
    ...prospects.map((p) =>
      prisma.prospectActivity.create({
        data: { prospectId: p.id, type: "email_send", description: `メール送信: ${email.name}`, metadata: { emailId: id } },
      })
    ),
  ]);

  await prisma.marketingEmail.update({ where: { id }, data: { status: "sent" } });
  await createAuditLog({ userId, objectType: "MarketingEmail", objectId: id, action: "UPDATE", after: { status: "sent", totalSent: prospects.length } });

  return { sent: prospects.length };
}

export async function getEmailStats() {
  const [total, sent, drafts, scheduled] = await Promise.all([
    prisma.marketingEmail.count({ where: { deletedAt: null } }),
    prisma.marketingEmail.count({ where: { deletedAt: null, status: "sent" } }),
    prisma.marketingEmail.count({ where: { deletedAt: null, status: "draft" } }),
    prisma.marketingEmail.count({ where: { deletedAt: null, status: "scheduled" } }),
  ]);
  const agg = await prisma.marketingEmail.aggregate({
    where: { deletedAt: null, status: "sent" },
    _sum: { totalSent: true, totalOpened: true, totalClicked: true },
  });
  return {
    total, sent, drafts, scheduled,
    totalSent: agg._sum.totalSent ?? 0,
    totalOpened: agg._sum.totalOpened ?? 0,
    totalClicked: agg._sum.totalClicked ?? 0,
  };
}
