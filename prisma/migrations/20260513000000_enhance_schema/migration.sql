-- AlterTable: User - rename password to passwordHash, add role and deletedAt
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'SALES';
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Company - add new fields
ALTER TABLE "Company" ADD COLUMN "phone" TEXT;
ALTER TABLE "Company" ADD COLUMN "address" TEXT;
ALTER TABLE "Company" ADD COLUMN "annualRevenue" DOUBLE PRECISION;
ALTER TABLE "Company" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Contact - add deletedAt
ALTER TABLE "Contact" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Deal - add lostReason and deletedAt
ALTER TABLE "Deal" ADD COLUMN "lostReason" TEXT;
ALTER TABLE "Deal" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Activity - add createdById
ALTER TABLE "Activity" ADD COLUMN "createdById" TEXT;

-- AlterTable: Task - add assigneeId
ALTER TABLE "Task" ADD COLUMN "assigneeId" TEXT;

-- CreateIndex on Company
CREATE INDEX "Company_status_idx" ON "Company"("status");
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");
CREATE INDEX "Company_companyName_idx" ON "Company"("companyName");

-- CreateIndex on Contact
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Contact_deletedAt_idx" ON "Contact"("deletedAt");

-- CreateIndex on Deal
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");
CREATE INDEX "Deal_expectedCloseDate_idx" ON "Deal"("expectedCloseDate");
CREATE INDEX "Deal_deletedAt_idx" ON "Deal"("deletedAt");

-- CreateIndex on Activity
CREATE INDEX "Activity_companyId_idx" ON "Activity"("companyId");
CREATE INDEX "Activity_dealId_idx" ON "Activity"("dealId");
CREATE INDEX "Activity_activityDate_idx" ON "Activity"("activityDate");

-- CreateIndex on Task
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_dealId_idx" ON "Task"("dealId");

-- CreateTable: Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objectType" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '[]',
    "sortField" TEXT,
    "sortDir" TEXT NOT NULL DEFAULT 'desc',
    "groupBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_objectType_idx" ON "Report"("objectType");
CREATE INDEX "Report_createdById_idx" ON "Report"("createdById");
CREATE INDEX "Report_deletedAt_idx" ON "Report"("deletedAt");

ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Dashboard
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Dashboard_deletedAt_idx" ON "Dashboard"("deletedAt");

-- CreateTable: DashboardWidget
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "reportId" TEXT,
    "widgetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 6,
    "height" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DashboardWidget_dashboardId_idx" ON "DashboardWidget"("dashboardId");

ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: SavedView
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "sortField" TEXT,
    "sortDir" TEXT NOT NULL DEFAULT 'asc',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedView_objectType_idx" ON "SavedView"("objectType");
CREATE INDEX "SavedView_userId_idx" ON "SavedView"("userId");

-- CreateTable: ImportJob
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportJob_objectType_idx" ON "ImportJob"("objectType");
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateTable: ExportJob
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExportJob_objectType_idx" ON "ExportJob"("objectType");
CREATE INDEX "ExportJob_createdAt_idx" ON "ExportJob"("createdAt");

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_objectType_objectId_idx" ON "AuditLog"("objectType", "objectId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: DataTag
CREATE TABLE "DataTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#0176d3',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DataTag_name_key" ON "DataTag"("name");

-- CreateTable: CompanyTag
CREATE TABLE "CompanyTag" (
    "companyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTag_pkey" PRIMARY KEY ("companyId","tagId")
);

ALTER TABLE "CompanyTag" ADD CONSTRAINT "CompanyTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyTag" ADD CONSTRAINT "CompanyTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "DataTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: DealTag
CREATE TABLE "DealTag" (
    "dealId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealTag_pkey" PRIMARY KEY ("dealId","tagId")
);

ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "DataTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
