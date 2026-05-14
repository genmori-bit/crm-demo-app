import { prisma } from "./prisma";
import { PermissionKey } from "./permissions";
import { NextResponse } from "next/server";

interface SessionUser {
  id: string;
  email?: string | null;
  role: string;
}

// Fetch merged permissions from profile + permission sets
export async function getEffectivePermissions(userId: string): Promise<Set<PermissionKey>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      permissionSetAssignments: { include: { permissionSet: true } },
    },
  });

  if (!user) return new Set();

  const perms = new Set<PermissionKey>();

  // Profile base permissions
  if (user.profile) {
    const profilePerms = user.profile.permissions as Record<string, boolean>;
    for (const [key, val] of Object.entries(profilePerms)) {
      if (val) perms.add(key as PermissionKey);
    }
  }

  // Additive permission sets
  for (const assignment of user.permissionSetAssignments) {
    const psPerms = assignment.permissionSet.permissions as Record<string, boolean>;
    for (const [key, val] of Object.entries(psPerms)) {
      if (val) perms.add(key as PermissionKey);
    }
  }

  return perms;
}

// Check if a session user (from JWT) has a permission — uses role as fast path
export function hasRolePermission(role: string, key: PermissionKey): boolean {
  if (role === "ADMIN") return true;
  if (role === "MANAGER") {
    const managerDenied: PermissionKey[] = [
      "company.delete", "deal.delete", "contact.delete", "activity.delete",
      "setup.user.create", "setup.user.disable", "setup.role.manage",
      "setup.profile.manage", "setup.permissionset.manage",
      "setup.appaccess.manage", "setup.security.manage", "setup.org.manage",
    ];
    return !managerDenied.includes(key);
  }
  // SALES
  const salesAllowed: PermissionKey[] = [
    "company.view", "company.create", "company.edit",
    "contact.view", "contact.create", "contact.edit",
    "deal.view", "deal.create", "deal.edit",
    "activity.view", "activity.create", "activity.edit",
    "task.view", "task.create", "task.edit",
    "report.view", "dashboard.view",
    "ma.view", "ma.prospect.view",
  ];
  return salesAllowed.includes(key);
}

// Lightweight check using session role (no DB call) — use for most API routes
export function requireRole(user: SessionUser, key: PermissionKey): NextResponse | null {
  if (!hasRolePermission(user.role, key)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// Setup access requires ADMIN role
export function requireAdmin(user: SessionUser): NextResponse | null {
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
