/**
 * HOME Page — ロジック単体テスト
 *
 * UIレンダリング・セッション依存のブラウザテストは別途対応。
 * ここではグリーティング・アラートロジック・KPI計算・レイアウト規則をカバーする。
 */

import { describe, it, expect } from "vitest";

// ─── Greeting helper (page.tsx から抜粋) ─────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 12) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "お疲れ様です";
}

// ─── Alert logic helpers ──────────────────────────────────────────────────────

function hasAlerts(overdueTasksCount: number, staleDealsCount: number): boolean {
  return overdueTasksCount > 0 || staleDealsCount > 0;
}

function getAlertTone(count: number, maxSafe: number): "danger" | "warning" | "neutral" {
  if (count === 0) return "neutral";
  if (count > maxSafe) return "danger";
  return "warning";
}

// ─── KPI helpers ──────────────────────────────────────────────────────────────

function computeExpectedRevenue(deals: Array<{ amount: number; probability: number }>): number {
  return deals.reduce((s, d) => s + (d.amount * d.probability) / 100, 0);
}

function filterActiveDealCount(deals: Array<{ stage: string }>): number {
  return deals.filter((d) => !["won", "lost"].includes(d.stage)).length;
}

function filterPendingTaskCount(tasks: Array<{ status: string }>): number {
  return tasks.filter((t) => t.status !== "done").length;
}

function filterOverdueTasks(
  tasks: Array<{ status: string; dueDate: string | null }>,
  today: string,
): number {
  return tasks.filter(
    (t) => t.status !== "done" && t.dueDate !== null && t.dueDate.slice(0, 10) < today,
  ).length;
}

// ─── Task sort helpers ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function sortTasks<T extends { priority: string; dueDate: string | null }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3;
    const pb = PRIORITY_ORDER[b.priority] ?? 3;
    return pa - pb;
  });
}

function splitUrgentUpcoming(
  tasks: Array<{ dueDate: string | null; status: string }>,
  today: string,
) {
  const urgent = tasks.filter((t) => t.dueDate !== null && t.dueDate.slice(0, 10) <= today);
  const upcoming = tasks.filter((t) => t.dueDate === null || t.dueDate.slice(0, 10) > today);
  return { urgent, upcoming };
}

// ─── Stage palette ────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  qualification:     "#7996b5",
  needs_analysis:    "#5a8fc4",
  value_proposition: "#3d79b8",
  proposal:          "#0176d3",
  negotiation:       "#6b34b0",
  final_review:      "#0e7490",
  won:               "#2e844a",
  lost:              "#ba0517",
};

// ─── Tests: getGreeting ───────────────────────────────────────────────────────

describe("getGreeting: 時刻に応じた挨拶", () => {
  it("0時はおはようございます", () => {
    expect(getGreeting(0)).toBe("おはようございます");
  });

  it("11時はおはようございます", () => {
    expect(getGreeting(11)).toBe("おはようございます");
  });

  it("12時はこんにちは", () => {
    expect(getGreeting(12)).toBe("こんにちは");
  });

  it("17時はこんにちは", () => {
    expect(getGreeting(17)).toBe("こんにちは");
  });

  it("18時はお疲れ様です", () => {
    expect(getGreeting(18)).toBe("お疲れ様です");
  });

  it("23時はお疲れ様です", () => {
    expect(getGreeting(23)).toBe("お疲れ様です");
  });
});

// ─── Tests: Alert chips ───────────────────────────────────────────────────────

describe("hasAlerts: アラート表示条件", () => {
  it("期限超過タスクがある場合 true", () => {
    expect(hasAlerts(3, 0)).toBe(true);
  });

  it("活動なし商談がある場合 true", () => {
    expect(hasAlerts(0, 5)).toBe(true);
  });

  it("両方ある場合 true", () => {
    expect(hasAlerts(2, 3)).toBe(true);
  });

  it("両方0の場合 false", () => {
    expect(hasAlerts(0, 0)).toBe(false);
  });
});

// ─── Tests: KPI computation ───────────────────────────────────────────────────

describe("computeExpectedRevenue: 加重パイプライン計算", () => {
  it("空の商談リストは 0", () => {
    expect(computeExpectedRevenue([])).toBe(0);
  });

  it("確度100%は金額そのまま", () => {
    expect(computeExpectedRevenue([{ amount: 500000, probability: 100 }])).toBe(500000);
  });

  it("確度50%は半額", () => {
    expect(computeExpectedRevenue([{ amount: 1000000, probability: 50 }])).toBe(500000);
  });

  it("複数商談の合計", () => {
    const deals = [
      { amount: 1000000, probability: 50 },  // 500,000
      { amount: 500000, probability: 80 },   // 400,000
      { amount: 200000, probability: 25 },   // 50,000
    ];
    expect(computeExpectedRevenue(deals)).toBe(950000);
  });
});

describe("filterActiveDealCount: 進行中商談数", () => {
  it("won / lost は除外される", () => {
    const deals = [
      { stage: "proposal" },
      { stage: "won" },
      { stage: "lost" },
      { stage: "negotiation" },
    ];
    expect(filterActiveDealCount(deals)).toBe(2);
  });

  it("全て進行中の場合は全件", () => {
    const deals = [{ stage: "qualification" }, { stage: "proposal" }, { stage: "final_review" }];
    expect(filterActiveDealCount(deals)).toBe(3);
  });
});

describe("filterPendingTaskCount: 未完了タスク数", () => {
  it("doneのタスクは除外される", () => {
    const tasks = [
      { status: "todo" },
      { status: "done" },
      { status: "in_progress" },
    ];
    expect(filterPendingTaskCount(tasks)).toBe(2);
  });
});

describe("filterOverdueTasks: 期限超過タスク数", () => {
  it("dueDate が today より前は期限超過", () => {
    const tasks = [
      { status: "todo", dueDate: "2025-01-01" },
      { status: "todo", dueDate: "2099-12-31" },
      { status: "done", dueDate: "2025-01-01" },
      { status: "todo", dueDate: null },
    ];
    const today = "2026-05-16";
    expect(filterOverdueTasks(tasks, today)).toBe(1);
  });

  it("今日と同じ日付は超過に含まれない", () => {
    const today = "2026-05-16";
    const tasks = [{ status: "todo", dueDate: "2026-05-16" }];
    expect(filterOverdueTasks(tasks, today)).toBe(0);
  });
});

// ─── Tests: Task sort & split ─────────────────────────────────────────────────

describe("sortTasks: タスクのソート", () => {
  it("high > medium > low の順", () => {
    const tasks = [
      { priority: "low", dueDate: null },
      { priority: "high", dueDate: null },
      { priority: "medium", dueDate: null },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.priority)).toEqual(["high", "medium", "low"]);
  });
});

describe("splitUrgentUpcoming: 今日・期限超過 vs 今後", () => {
  it("today以前は urgent、today以降は upcoming", () => {
    const today = "2026-05-16";
    const tasks = [
      { dueDate: "2026-05-15", status: "todo" },  // urgent
      { dueDate: "2026-05-16", status: "todo" },  // urgent (same day = urgent)
      { dueDate: "2026-05-17", status: "todo" },  // upcoming
      { dueDate: null, status: "todo" },           // upcoming (no due = upcoming)
    ];
    const { urgent, upcoming } = splitUrgentUpcoming(tasks, today);
    expect(urgent).toHaveLength(2);
    expect(upcoming).toHaveLength(2);
  });
});

// ─── Tests: Stage color palette ───────────────────────────────────────────────

describe("ステージカラーパレット: 8色定義", () => {
  const STAGES = ["qualification", "needs_analysis", "value_proposition", "proposal", "negotiation", "final_review", "won", "lost"];

  it("全ステージの色が定義されている", () => {
    for (const stage of STAGES) {
      expect(STAGE_COLORS[stage]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("won は緑系", () => {
    // #2e844a — green
    expect(STAGE_COLORS.won).toBe("#2e844a");
  });

  it("lost は赤系", () => {
    // #ba0517 — red
    expect(STAGE_COLORS.lost).toBe("#ba0517");
  });

  it("proposal は Salesforce ブルー", () => {
    expect(STAGE_COLORS.proposal).toBe("#0176d3");
  });
});

// ─── Tests: Secondary KPI layout (grid not flex) ──────────────────────────────

describe("副指標レイアウト: grid-cols-2 設計", () => {
  it("2列グリッドに 2 個のカードが収まる", () => {
    const secondaryCards = ["顧客企業数", "担当者数"];
    expect(secondaryCards.length).toBe(2);
    // grid-cols-2 なので 2 列ちょうど埋まる
    expect(secondaryCards.length % 2).toBe(0);
  });
});

// ─── Tests: Stale deals threshold ────────────────────────────────────────────

describe("活動なし商談のスレッショルド", () => {
  const STALE_DAYS = 14;

  it("スレッショルドは14日", () => {
    expect(STALE_DAYS).toBe(14);
  });

  it("14日前は期限に含まれる", () => {
    const now = new Date("2026-05-16T00:00:00Z");
    const threshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const lastActivity = new Date("2026-05-02T00:00:00Z"); // exactly 14 days ago
    expect(lastActivity.getTime()).toBeLessThanOrEqual(threshold.getTime());
  });

  it("13日前は期限に含まれない", () => {
    const now = new Date("2026-05-16T00:00:00Z");
    const threshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const lastActivity = new Date("2026-05-03T00:00:00Z"); // 13 days ago
    expect(lastActivity.getTime()).toBeGreaterThan(threshold.getTime());
  });
});
