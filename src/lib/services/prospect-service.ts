import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit-log";

export type ProspectWithActivity = Awaited<ReturnType<typeof getProspect>>;

export async function listProspects(opts: {
  search?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  grade?: string;
  assignedUserId?: string;
  listId?: string;
  page?: number;
  limit?: number;
}) {
  const { search, status, minScore, maxScore, grade, assignedUserId, listId, page = 1, limit = 50 } = opts;
  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (minScore !== undefined || maxScore !== undefined) {
    where.score = {};
    if (minScore !== undefined) (where.score as Record<string, number>).gte = minScore;
    if (maxScore !== undefined) (where.score as Record<string, number>).lte = maxScore;
  }
  if (grade) where.grade = grade;
  if (assignedUserId) where.assignedUserId = assignedUserId;
  if (listId) {
    where.listMemberships = { some: { listId } };
  }

  const [total, prospects] = await Promise.all([
    prisma.prospect.count({ where }),
    prisma.prospect.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { prospects, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProspect(id: string) {
  return prisma.prospect.findFirst({
    where: { id, deletedAt: null },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      listMemberships: { include: { list: { select: { id: true, name: true } } } },
      emailRecipients: {
        include: { email: { select: { id: true, name: true, subject: true, sentAt: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      formSubmissions: {
        include: { form: { select: { id: true, name: true } } },
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createProspect(
  data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    source?: string | null;
    assignedUserId?: string | null;
  },
  userId: string,
) {
  const prospect = await prisma.prospect.create({ data });
  await createAuditLog({ userId, objectType: "Prospect", objectId: prospect.id, action: "CREATE", after: data as Record<string, unknown> });
  return prospect;
}

export async function updateProspect(id: string, data: Partial<{
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  doNotEmail: boolean;
  optedOut: boolean;
  assignedUserId: string | null;
}>, userId: string) {
  const before = await prisma.prospect.findUnique({ where: { id } });
  const prospect = await prisma.prospect.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  await createAuditLog({ userId, objectType: "Prospect", objectId: id, action: "UPDATE", before: before as Record<string, unknown>, after: data as Record<string, unknown> });
  return prospect;
}

export async function deleteProspect(id: string, userId: string) {
  await prisma.prospect.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({ userId, objectType: "Prospect", objectId: id, action: "DELETE" });
}

export async function addScore(prospectId: string, delta: number, reason: string) {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
  if (!prospect) return null;
  const newScore = Math.max(0, Math.min(200, prospect.score + delta));
  await prisma.prospect.update({ where: { id: prospectId }, data: { score: newScore, lastActivityAt: new Date() } });
  await prisma.prospectActivity.create({
    data: { prospectId, type: "score_change", description: reason, score: delta },
  });
  return newScore;
}

export async function getProspectStats() {
  const [total, active, converted, optedOut, avgScore] = await Promise.all([
    prisma.prospect.count({ where: { deletedAt: null } }),
    prisma.prospect.count({ where: { deletedAt: null, status: "active" } }),
    prisma.prospect.count({ where: { deletedAt: null, isConverted: true } }),
    prisma.prospect.count({ where: { deletedAt: null, optedOut: true } }),
    prisma.prospect.aggregate({ where: { deletedAt: null }, _avg: { score: true } }),
  ]);
  return { total, active, converted, optedOut, avgScore: Math.round(avgScore._avg.score ?? 0) };
}
