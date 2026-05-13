-- Drop existing Dashboard/DashboardWidget tables (they're empty) and recreate with new schema

DROP TABLE IF EXISTS "DashboardWidget";
DROP TABLE IF EXISTS "Dashboard";

-- CreateTable: Dashboard (redesigned)
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "defaultDateRange" TEXT,
    "filters" JSONB,
    "layout" JSONB,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Dashboard_visibility_idx" ON "Dashboard"("visibility");
CREATE INDEX "Dashboard_ownerId_idx" ON "Dashboard"("ownerId");
CREATE INDEX "Dashboard_deletedAt_idx" ON "Dashboard"("deletedAt");

ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: DashboardWidget (redesigned)
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL DEFAULT '{}',
    "size" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DashboardWidget_dashboardId_idx" ON "DashboardWidget"("dashboardId");
CREATE INDEX "DashboardWidget_reportId_idx" ON "DashboardWidget"("reportId");

ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey"
  FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add User.dashboards relation (ownerId already added via FK above)
-- (No column change needed on User side — it's a virtual relation in Prisma)
