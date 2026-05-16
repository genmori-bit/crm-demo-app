import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from "date-fns";

export type WidgetType = "KPI" | "TABLE" | "BAR" | "LINE" | "PIE" | "DONUT" | "FUNNEL";

export type ChartDataPoint = { label: string; value: number; count?: number; color?: string };
export type TimeDataPoint = { date: string; value: number; count?: number };

export type ReportExecutionResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  summary: { count: number; sumAmount?: number; avgAmount?: number; [key: string]: unknown };
  chartData: ChartDataPoint[];
  timeData?: TimeDataPoint[];
  totalCount: number;
  executedAt: string;
};

type DashboardFilters = {
  dateRange?: string;
  dateField?: string;
  stage?: string;
  companyStatus?: string;
};

export function getDateRange(dateRange: string): { gte?: Date; lte?: Date } {
  const now = new Date();
  switch (dateRange) {
    case "thisMonth": return { gte: startOfMonth(now), lte: endOfMonth(now) };
    case "thisQuarter": return { gte: startOfQuarter(now), lte: endOfQuarter(now) };
    case "thisYear": return { gte: startOfYear(now), lte: endOfYear(now) };
    case "last30": return { gte: subDays(now, 30), lte: now };
    default: return {};
  }
}

const STAGE_ORDER = ["qualification", "needs_analysis", "value_proposition", "proposal", "negotiation", "final_review", "won", "lost"];
const STAGE_LABELS: Record<string, string> = {
  qualification:     "初期確認",
  needs_analysis:    "課題確認",
  value_proposition: "価値提案",
  proposal:          "提案",
  negotiation:       "交渉",
  final_review:      "最終確認",
  won:               "受注",
  lost:              "失注",
};
const STAGE_COLORS: Record<string, string> = {
  qualification:     "#706e6b",
  needs_analysis:    "#dd7a01",
  value_proposition: "#e57200",
  proposal:          "#0176d3",
  negotiation:       "#6b34b0",
  final_review:      "#0e7490",
  won:               "#2e844a",
  lost:              "#ea001e",
};
const CHART_COLORS = ["#0176d3","#2e844a","#dd7a01","#6b34b0","#ea001e","#0e7490","#0f766e","#7c3aed","#be185d","#b45309"];

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

async function fetchDeals(dashFilters: DashboardFilters, limit = 1000) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (dashFilters.stage) where.stage = dashFilters.stage;
  if (dashFilters.companyStatus) {
    where.company = { status: dashFilters.companyStatus };
  }
  if (dashFilters.dateRange && dashFilters.dateRange !== "all") {
    const range = getDateRange(dashFilters.dateRange);
    if (range.gte || range.lte) {
      const field = dashFilters.dateField ?? "expectedCloseDate";
      where[field] = range;
    }
  }
  return prisma.deal.findMany({
    where,
    include: {
      company: { select: { companyName: true, status: true } },
      contact: { select: { fullName: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function fetchActivities(dashFilters: DashboardFilters, limit = 1000) {
  const where: Record<string, unknown> = {};
  if (dashFilters.dateRange && dashFilters.dateRange !== "all") {
    const range = getDateRange(dashFilters.dateRange);
    if (range.gte || range.lte) where.activityDate = range;
  }
  return prisma.activity.findMany({
    where,
    include: {
      company: { select: { companyName: true } },
      deal: { select: { dealName: true } },
      owner: { select: { name: true } },
    },
    orderBy: { activityDate: "desc" },
    take: limit,
  });
}

async function fetchTasks(dashFilters: DashboardFilters, limit = 1000) {
  const where: Record<string, unknown> = {};
  if (dashFilters.dateRange && dashFilters.dateRange !== "all") {
    const range = getDateRange(dashFilters.dateRange);
    if (range.gte || range.lte) where.dueDate = range;
  }
  return prisma.task.findMany({
    where,
    include: { deal: { select: { dealName: true } } },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}

async function fetchCompanies(dashFilters: DashboardFilters, limit = 1000) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (dashFilters.companyStatus) where.status = dashFilters.companyStatus;
  return prisma.company.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
}

export async function executeReportForWidget(
  report: {
    id: string;
    objectType: string;
    columns: string[];
    filters: unknown[];
    sortField?: string | null;
    sortDir: string;
  },
  widgetType: WidgetType,
  widgetConfig: Record<string, unknown>,
  dashFilters: DashboardFilters = {},
): Promise<ReportExecutionResult> {
  const executedAt = new Date().toISOString();
  const config = widgetConfig;

  try {
    switch (report.objectType) {
      case "deal": return await executeDealReport(widgetType, config, dashFilters, executedAt);
      case "activity": return await executeActivityReport(widgetType, config, dashFilters, executedAt);
      case "task": return await executeTaskReport(widgetType, config, dashFilters, executedAt);
      case "company": return await executeCompanyReport(widgetType, config, dashFilters, executedAt);
      default: return emptyResult(executedAt);
    }
  } catch {
    return emptyResult(executedAt);
  }
}

async function executeDealReport(
  widgetType: WidgetType,
  config: Record<string, unknown>,
  dashFilters: DashboardFilters,
  executedAt: string,
): Promise<ReportExecutionResult> {
  const limit = widgetType === "TABLE" ? (Number(config.limit) || 10) : 500;
  const deals = await fetchDeals(dashFilters, limit);

  const sumAmount = deals.reduce((s, d) => s + d.amount, 0);
  const avgAmount = deals.length > 0 ? sumAmount / deals.length : 0;
  const weightedAmount = deals.reduce((s, d) => s + (d.amount * d.probability) / 100, 0);

  const summary = {
    count: deals.length,
    sumAmount,
    avgAmount,
    weightedAmount,
  };

  if (widgetType === "KPI") {
    const metric = String(config.metric ?? "sumAmount");
    const value = metric === "count" ? deals.length
      : metric === "sumAmount" ? sumAmount
      : metric === "weightedAmount" ? weightedAmount
      : metric === "avgAmount" ? avgAmount
      : deals.length;
    return {
      columns: ["value"],
      rows: [{ value }],
      summary,
      chartData: [{ label: "値", value }],
      totalCount: deals.length,
      executedAt,
    };
  }

  if (widgetType === "TABLE") {
    const columns = (config.columns as string[]) ?? ["dealName", "stage", "amount", "expectedCloseDate"];
    const rows = deals.slice(0, Number(config.limit) || 10).map((d) => ({
      id: d.id,
      dealName: d.dealName,
      stage: STAGE_LABELS[d.stage] ?? d.stage,
      amount: d.amount,
      probability: d.probability,
      expectedCloseDate: d.expectedCloseDate,
      "company.companyName": d.company.companyName,
      "contact.fullName": d.contact?.fullName,
      href: `/deals/${d.id}`,
    }));
    return { columns, rows, summary, chartData: [], totalCount: deals.length, executedAt };
  }

  if (widgetType === "FUNNEL") {
    const metric = String(config.metric ?? "amount");
    const grouped = groupBy(deals, (d) => d.stage);
    const chartData = STAGE_ORDER.map((stage, i) => {
      const stageDealz = grouped.get(stage) ?? [];
      const value = metric === "count" ? stageDealz.length : stageDealz.reduce((s, d) => s + d.amount, 0);
      return { label: STAGE_LABELS[stage] ?? stage, value, count: stageDealz.length, color: STAGE_COLORS[stage] ?? CHART_COLORS[i % CHART_COLORS.length] };
    });
    return { columns: ["stage", "value"], rows: [], summary, chartData, totalCount: deals.length, executedAt };
  }

  if (widgetType === "BAR" || widgetType === "PIE" || widgetType === "DONUT") {
    const xAxis = String(config.xAxis ?? "stage");
    const metric = String(config.metric ?? "amount");
    const lim = Number(config.limit ?? 10);
    const grouped = groupBy(deals, (d) => {
      if (xAxis === "owner") return d.owner?.name ?? "未割当";
      const v = (d as Record<string, unknown>)[xAxis];
      return v != null ? String(v) : "不明";
    });
    const entries = [...grouped.entries()].map(([label, items], i) => ({
      label: xAxis === "stage" ? (STAGE_LABELS[label] ?? label) : label,
      value: metric === "count" ? items.length : items.reduce((s, d) => s + d.amount, 0),
      count: items.length,
      color: xAxis === "stage" ? (STAGE_COLORS[label] ?? CHART_COLORS[i % CHART_COLORS.length]) : CHART_COLORS[i % CHART_COLORS.length],
    })).sort((a, b) => b.value - a.value).slice(0, lim);
    return { columns: [xAxis, metric], rows: [], summary, chartData: entries, totalCount: deals.length, executedAt };
  }

  if (widgetType === "LINE") {
    const dateGroup = String(config.dateGroup ?? "month");
    const metric = String(config.metric ?? "amount");
    const grouped = groupBy(deals.filter((d) => d.expectedCloseDate), (d) => {
      const date = new Date(d.expectedCloseDate!);
      if (dateGroup === "month") return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (dateGroup === "quarter") return `${date.getFullYear()} Q${Math.ceil((date.getMonth() + 1) / 3)}`;
      return `${date.getFullYear()}`;
    });
    const timeData = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({
      date,
      value: metric === "count" ? items.length : items.reduce((s, d) => s + d.amount, 0),
      count: items.length,
    }));
    const chartData = timeData.map((t, i) => ({ label: t.date, value: t.value, color: CHART_COLORS[i % CHART_COLORS.length] }));
    return { columns: ["date", metric], rows: [], summary, chartData, timeData, totalCount: deals.length, executedAt };
  }

  return emptyResult(executedAt);
}

async function executeActivityReport(
  widgetType: WidgetType,
  config: Record<string, unknown>,
  dashFilters: DashboardFilters,
  executedAt: string,
): Promise<ReportExecutionResult> {
  const activities = await fetchActivities(dashFilters);
  const summary = { count: activities.length };

  if (widgetType === "KPI") {
    return { columns: ["count"], rows: [{ count: activities.length }], summary, chartData: [{ label: "件数", value: activities.length }], totalCount: activities.length, executedAt };
  }

  if (widgetType === "TABLE") {
    const rows = activities.slice(0, Number(config.limit) || 10).map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      activityDate: a.activityDate,
      "company.companyName": a.company?.companyName,
      "deal.dealName": a.deal?.dealName,
      "owner.name": a.owner?.name,
      href: `/activities`,
    }));
    return { columns: ["type", "subject", "activityDate"], rows, summary, chartData: [], totalCount: activities.length, executedAt };
  }

  const xAxis = String(config.xAxis ?? "type");
  const typeLabels: Record<string, string> = { note: "メモ", phone: "電話", email: "メール", meeting: "商談", visit: "訪問", other: "その他" };
  const outcomeLabels: Record<string, string> = { POSITIVE: "良好", NEUTRAL: "中立", NEGATIVE: "懸念" };

  const grouped = groupBy(activities, (a) => {
    if (xAxis === "owner") return a.owner?.name ?? "未割当";
    if (xAxis === "outcome") return a.outcome ?? "未記録";
    const v = (a as Record<string, unknown>)[xAxis];
    return v != null ? String(v) : "不明";
  });
  const chartData = [...grouped.entries()].map(([label, items], i) => ({
    label: xAxis === "type" ? (typeLabels[label] ?? label)
         : xAxis === "outcome" ? (outcomeLabels[label] ?? label)
         : label,
    value: items.length,
    count: items.length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value).slice(0, 12);

  if (widgetType === "LINE") {
    const dateGroup = String(config.dateGroup ?? "month");
    const dateGrouped = groupBy(activities, (a) => {
      const date = new Date(a.activityDate);
      if (dateGroup === "month") return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (dateGroup === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      }
      return `${date.getFullYear()}`;
    });
    const timeData = [...dateGrouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([d, items]) => ({
      date: d, value: items.length, count: items.length,
    }));
    const lineChartData = timeData.map((t, i) => ({ label: t.date, value: t.value, color: CHART_COLORS[i % CHART_COLORS.length] }));
    return { columns: ["date", "count"], rows: [], summary, chartData: lineChartData, timeData, totalCount: activities.length, executedAt };
  }

  return { columns: [xAxis, "count"], rows: [], summary, chartData, totalCount: activities.length, executedAt };
}

async function executeTaskReport(
  widgetType: WidgetType,
  config: Record<string, unknown>,
  dashFilters: DashboardFilters,
  executedAt: string,
): Promise<ReportExecutionResult> {
  const tasks = await fetchTasks(dashFilters);
  const now = new Date();
  const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now);
  const summary = { count: tasks.length, overdueCount: overdue.length };

  if (widgetType === "KPI") {
    const metric = String(config.metric ?? "count");
    const value = metric === "overdueCount" ? overdue.length : tasks.length;
    return { columns: ["value"], rows: [{ value }], summary, chartData: [{ label: "件数", value }], totalCount: tasks.length, executedAt };
  }

  if (widgetType === "TABLE") {
    const rows = tasks.slice(0, Number(config.limit) || 10).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      href: `/tasks/${t.id}/edit`,
    }));
    return { columns: ["title", "status", "priority", "dueDate"], rows, summary, chartData: [], totalCount: tasks.length, executedAt };
  }

  const xAxis = String(config.xAxis ?? "status");
  const statusLabels: Record<string, string> = { todo: "未着手", inProgress: "進行中", done: "完了" };
  const grouped = groupBy(tasks, (t) => String((t as Record<string, unknown>)[xAxis] ?? "不明"));
  const chartData = [...grouped.entries()].map(([label, items], i) => ({
    label: xAxis === "status" ? (statusLabels[label] ?? label) : label,
    value: items.length,
    count: items.length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  return { columns: [xAxis, "count"], rows: [], summary, chartData, totalCount: tasks.length, executedAt };
}

async function executeCompanyReport(
  widgetType: WidgetType,
  config: Record<string, unknown>,
  dashFilters: DashboardFilters,
  executedAt: string,
): Promise<ReportExecutionResult> {
  const companies = await fetchCompanies(dashFilters);
  const summary = { count: companies.length };

  if (widgetType === "KPI") {
    return { columns: ["count"], rows: [{ count: companies.length }], summary, chartData: [{ label: "企業数", value: companies.length }], totalCount: companies.length, executedAt };
  }

  if (widgetType === "TABLE") {
    const rows = companies.slice(0, Number(config.limit) || 10).map((c) => ({
      id: c.id,
      companyName: c.companyName,
      industry: c.industry,
      status: c.status,
      href: `/companies/${c.id}`,
    }));
    return { columns: ["companyName", "industry", "status"], rows, summary, chartData: [], totalCount: companies.length, executedAt };
  }

  const xAxis = String(config.xAxis ?? "status");
  const statusLabels: Record<string, string> = { prospect: "見込み", active: "取引中", negotiating: "交渉中", lost: "失注", inactive: "休眠" };
  const grouped = groupBy(companies, (c) => String((c as Record<string, unknown>)[xAxis] ?? "不明"));
  const chartData = [...grouped.entries()].map(([label, items], i) => ({
    label: xAxis === "status" ? (statusLabels[label] ?? label) : label,
    value: items.length,
    count: items.length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  return { columns: [xAxis, "count"], rows: [], summary, chartData, totalCount: companies.length, executedAt };
}

function emptyResult(executedAt: string): ReportExecutionResult {
  return { columns: [], rows: [], summary: { count: 0 }, chartData: [], totalCount: 0, executedAt };
}
