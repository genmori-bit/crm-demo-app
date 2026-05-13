import { prisma } from "@/lib/prisma";

export async function createAuditLog(params: {
  userId?: string | null;
  objectType: string;
  objectId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? undefined,
        objectType: params.objectType,
        objectId: params.objectId,
        action: params.action,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    });
  } catch {
    // audit logging must not break main flows
  }
}
