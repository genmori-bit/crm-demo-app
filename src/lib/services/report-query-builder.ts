import { prisma } from "@/lib/prisma";

const ALLOWED_COLUMNS: Record<string, Record<string, string>> = {
  deal: {
    dealName: "商談名",
    stage: "ステージ",
    amount: "金額",
    probability: "確度",
    expectedCloseDate: "クローズ予定日",
    nextAction: "次回アクション",
    createdAt: "登録日",
    "company.companyName": "顧客企業",
    "contact.fullName": "担当者",
  },
  company: {
    companyName: "会社名",
    industry: "業種",
    status: "ステータス",
    employeeSize: "規模",
    annualRevenue: "年商",
    createdAt: "登録日",
  },
  contact: {
    fullName: "氏名",
    email: "メールアドレス",
    phone: "電話番号",
    department: "部署",
    title: "役職",
    "company.companyName": "所属企業",
    createdAt: "登録日",
  },
  activity: {
    type: "種別",
    subject: "件名",
    activityDate: "活動日",
    "company.companyName": "企業",
    "deal.dealName": "商談",
    createdAt: "登録日",
  },
};

const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
  deal: ["dealName", "amount", "probability", "expectedCloseDate", "createdAt", "stage"],
  company: ["companyName", "industry", "status", "createdAt", "annualRevenue"],
  contact: ["fullName", "email", "department", "title", "createdAt"],
  activity: ["activityDate", "type", "subject", "createdAt"],
};

type ReportFilter = {
  field: string;
  operator: string;
  value: string;
};

function buildWhereClause(objectType: string, filters: ReportFilter[]) {
  const allowed = ALLOWED_COLUMNS[objectType] ?? {};
  const conditions: Record<string, unknown>[] = [];

  for (const f of filters) {
    if (!(f.field in allowed) || f.field.includes(".")) continue;

    let cond: Record<string, unknown>;
    switch (f.operator) {
      case "eq":
        cond = { [f.field]: f.value };
        break;
      case "neq":
        cond = { [f.field]: { not: f.value } };
        break;
      case "contains":
        cond = { [f.field]: { contains: f.value, mode: "insensitive" } };
        break;
      case "gt":
        cond = { [f.field]: { gt: Number(f.value) } };
        break;
      case "lt":
        cond = { [f.field]: { lt: Number(f.value) } };
        break;
      case "gte":
        cond = { [f.field]: { gte: Number(f.value) } };
        break;
      case "lte":
        cond = { [f.field]: { lte: Number(f.value) } };
        break;
      default:
        continue;
    }
    conditions.push(cond);
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function runReport(report: {
  objectType: string;
  columns: string[];
  filters: ReportFilter[];
  sortField?: string | null;
  sortDir: string;
  groupBy?: string | null;
}) {
  const { objectType, columns, filters, sortField, sortDir, groupBy } = report;
  const allowedCols = ALLOWED_COLUMNS[objectType] ?? {};
  const validCols = columns.filter((c) => c in allowedCols);
  const validSort = sortField && ALLOWED_SORT_FIELDS[objectType]?.includes(sortField)
    ? sortField
    : "createdAt";
  const validDir = sortDir === "asc" ? "asc" : "desc";
  const where = { ...buildWhereClause(objectType, filters), deletedAt: null };

  switch (objectType) {
    case "deal": {
      const rows = await prisma.deal.findMany({
        where,
        include: { company: { select: { companyName: true } }, contact: { select: { fullName: true } } },
        orderBy: { [validSort]: validDir },
        take: 1000,
      });
      return rows.map((r) => ({
        ...r,
        "company.companyName": r.company?.companyName,
        "contact.fullName": r.contact?.fullName,
      }));
    }
    case "company": {
      const rows = await prisma.company.findMany({
        where,
        orderBy: { [validSort]: validDir },
        take: 1000,
      });
      return rows;
    }
    case "contact": {
      const rows = await prisma.contact.findMany({
        where,
        include: { company: { select: { companyName: true } } },
        orderBy: { [validSort]: validDir },
        take: 1000,
      });
      return rows.map((r) => ({ ...r, "company.companyName": r.company?.companyName }));
    }
    case "activity": {
      const rows = await prisma.activity.findMany({
        where: buildWhereClause(objectType, filters),
        include: {
          company: { select: { companyName: true } },
          deal: { select: { dealName: true } },
        },
        orderBy: { [validSort]: validDir },
        take: 1000,
      });
      return rows.map((r) => ({
        ...r,
        "company.companyName": r.company?.companyName,
        "deal.dealName": r.deal?.dealName,
      }));
    }
    default:
      return [];
  }
}

export { ALLOWED_COLUMNS };
