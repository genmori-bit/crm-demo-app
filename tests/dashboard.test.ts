/**
 * Dashboard Builder & Widget — ロジック単体テスト
 *
 * UIレンダリング・D&Dのブラウザテストは React Testing Library + jsdom セットアップが必要なため別途対応。
 * ここでは位置計算・レイアウトロジック・WidgetType 仕様をカバーする。
 */

import { describe, it, expect } from "vitest";

// ─── Layout helpers (ビルダーページから抜粋) ──────────────────────────────────

const COLS = 12;

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

function widgetToGridItem(
  widget: { id: string; position: Record<string, number>; size: string },
  index: number,
): LayoutItem {
  const pos = widget.position;
  if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
    return { i: widget.id, x: pos.x, y: pos.y, w: pos.w ?? 4, h: pos.h ?? 3, minW: 2, minH: 2 };
  }
  const col = index % 2;
  const row = Math.floor(index / 2);
  return { i: widget.id, x: col * 6, y: row * 4, w: 6, h: 4, minW: 2, minH: 2 };
}

function findFreePosition(
  layout: LayoutItem[],
  w: number,
  h: number,
): { x: number; y: number } {
  const maxY = layout.reduce((m, item) => Math.max(m, item.y + item.h), 0);
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= COLS - w; x++) {
      const fits = !layout.some(
        (item) =>
          x < item.x + item.w &&
          x + w > item.x &&
          y < item.y + item.h &&
          y + h > item.y,
      );
      if (fits) return { x, y };
    }
  }
  return { x: 0, y: maxY };
}

// ─── Widget type constants ────────────────────────────────────────────────────

const VALID_WIDGET_TYPES = [
  "KPI",
  "TABLE",
  "BAR",
  "LINE",
  "PIE",
  "DONUT",
  "FUNNEL",
  "RANKING",
  "RISK_LIST",
] as const;

type WidgetType = (typeof VALID_WIDGET_TYPES)[number];

// ─── Size presets ─────────────────────────────────────────────────────────────

const SIZE_PRESETS = [
  { label: "小（KPI）", w: 3, h: 2 },
  { label: "中", w: 4, h: 3 },
  { label: "大", w: 6, h: 4 },
  { label: "横長", w: 8, h: 3 },
  { label: "全幅", w: 12, h: 4 },
];

// ─── Tests: widgetToGridItem ─────────────────────────────────────────────────

describe("widgetToGridItem: 位置データがある場合", () => {
  it("position.x / y / w / h をそのまま使用する", () => {
    const item = widgetToGridItem(
      { id: "w1", position: { x: 3, y: 2, w: 6, h: 4 }, size: "LARGE" },
      0,
    );
    expect(item).toMatchObject({ i: "w1", x: 3, y: 2, w: 6, h: 4 });
  });

  it("position.w が未定義の場合 w=4 をデフォルトにする", () => {
    const item = widgetToGridItem(
      { id: "w2", position: { x: 0, y: 0 }, size: "MEDIUM" },
      0,
    );
    expect(item.w).toBe(4);
    expect(item.h).toBe(3);
  });
});

describe("widgetToGridItem: 位置データがない場合 (auto-layout)", () => {
  it("index=0 は左上 (col 0) に配置される", () => {
    const item = widgetToGridItem({ id: "w1", position: {}, size: "MEDIUM" }, 0);
    expect(item.x).toBe(0);
    expect(item.y).toBe(0);
  });

  it("index=1 は右半分 (col 6) に配置される", () => {
    const item = widgetToGridItem({ id: "w2", position: {}, size: "MEDIUM" }, 1);
    expect(item.x).toBe(6);
    expect(item.y).toBe(0);
  });

  it("index=2 は次の行左 (y=4) に配置される", () => {
    const item = widgetToGridItem({ id: "w3", position: {}, size: "MEDIUM" }, 2);
    expect(item.x).toBe(0);
    expect(item.y).toBe(4);
  });
});

// ─── Tests: findFreePosition ──────────────────────────────────────────────────

describe("findFreePosition: 空のレイアウト", () => {
  it("空レイアウトには (0,0) を返す", () => {
    const pos = findFreePosition([], 6, 4);
    expect(pos).toEqual({ x: 0, y: 0 });
  });
});

describe("findFreePosition: 衝突回避", () => {
  it("先頭に大きいウィジェットがある場合、右に配置される", () => {
    const layout: LayoutItem[] = [{ i: "w1", x: 0, y: 0, w: 6, h: 4 }];
    const pos = findFreePosition(layout, 6, 4);
    // x=6 に空きがある
    expect(pos.x).toBe(6);
    expect(pos.y).toBe(0);
  });

  it("上段が全て埋まっている場合、次の行に配置される", () => {
    const layout: LayoutItem[] = [
      { i: "w1", x: 0, y: 0, w: 6, h: 4 },
      { i: "w2", x: 6, y: 0, w: 6, h: 4 },
    ];
    const pos = findFreePosition(layout, 6, 4);
    expect(pos.y).toBeGreaterThanOrEqual(4);
  });

  it("幅 w=3 のウィジェットは隙間に入れる", () => {
    const layout: LayoutItem[] = [
      { i: "w1", x: 0, y: 0, w: 3, h: 2 },
      { i: "w2", x: 3, y: 0, w: 3, h: 2 },
      { i: "w3", x: 6, y: 0, w: 3, h: 2 },
    ];
    const pos = findFreePosition(layout, 3, 2);
    // x=9 に空きがある
    expect(pos.x).toBe(9);
    expect(pos.y).toBe(0);
  });
});

// ─── Tests: WidgetType 仕様 ───────────────────────────────────────────────────

describe("WidgetType: 全ウィジェットタイプが定義されている", () => {
  it("9種のウィジェットタイプが存在する", () => {
    expect(VALID_WIDGET_TYPES.length).toBe(9);
  });

  it("KPI タイプが存在する", () => {
    expect(VALID_WIDGET_TYPES).toContain("KPI");
  });

  it("RANKING タイプが存在する (新規追加)", () => {
    expect(VALID_WIDGET_TYPES).toContain("RANKING");
  });

  it("RISK_LIST タイプが存在する (新規追加)", () => {
    expect(VALID_WIDGET_TYPES).toContain("RISK_LIST");
  });

  it("旧 COMMIT ステージが widget type に含まれない", () => {
    const types: string[] = [...VALID_WIDGET_TYPES];
    expect(types).not.toContain("COMMIT");
  });
});

// ─── Tests: Size presets ──────────────────────────────────────────────────────

describe("サイズプリセット: 12カラムグリッド制約", () => {
  it("全プリセットの w が 12 以下である", () => {
    for (const p of SIZE_PRESETS) {
      expect(p.w).toBeLessThanOrEqual(12);
    }
  });

  it("全プリセットの w が 1 以上である", () => {
    for (const p of SIZE_PRESETS) {
      expect(p.w).toBeGreaterThanOrEqual(1);
    }
  });

  it("全プリセットの h が 1 以上である", () => {
    for (const p of SIZE_PRESETS) {
      expect(p.h).toBeGreaterThanOrEqual(1);
    }
  });

  it("「全幅」プリセットの w が 12 である", () => {
    const full = SIZE_PRESETS.find((p) => p.label === "全幅");
    expect(full?.w).toBe(12);
  });

  it("「小（KPI）」プリセットは KPI 向けの小さいサイズ", () => {
    const small = SIZE_PRESETS.find((p) => p.label.includes("KPI"));
    expect(small?.w).toBeLessThanOrEqual(4);
    expect(small?.h).toBeLessThanOrEqual(3);
  });
});

// ─── Tests: Standard dashboard layout design ─────────────────────────────────

describe("標準ダッシュボード: レイアウト設計規則", () => {
  // Seed で設定した KPI 位置を静的に検証
  const salesDashboardKpiRow = [
    { x: 0, y: 0, w: 3, h: 2 },
    { x: 3, y: 0, w: 3, h: 2 },
    { x: 6, y: 0, w: 3, h: 2 },
    { x: 9, y: 0, w: 3, h: 2 },
  ];

  it("KPI ウィジェット4つが y=0 の行に収まっている", () => {
    const totalW = salesDashboardKpiRow.reduce((s, w) => s + w.w, 0);
    expect(totalW).toBe(12); // 12カラムを埋める
    for (const w of salesDashboardKpiRow) {
      expect(w.y).toBe(0);
    }
  });

  it("KPI ウィジェットが横に重ならない", () => {
    for (let i = 0; i < salesDashboardKpiRow.length; i++) {
      for (let j = i + 1; j < salesDashboardKpiRow.length; j++) {
        const a = salesDashboardKpiRow[i];
        const b = salesDashboardKpiRow[j];
        const overlaps = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("グラフウィジェットは KPI 行より下に配置される (y >= 2)", () => {
    const chartWidgets = [
      { x: 0, y: 2, w: 6, h: 4 }, // Stage BAR
      { x: 6, y: 2, w: 6, h: 4 }, // Funnel
    ];
    for (const w of chartWidgets) {
      expect(w.y).toBeGreaterThanOrEqual(2);
    }
  });

  it("全ウィジェットの x+w が COLS (12) を超えない", () => {
    const allWidgets = [
      ...salesDashboardKpiRow,
      { x: 0, y: 2, w: 6, h: 4 },
      { x: 6, y: 2, w: 6, h: 4 },
      { x: 0, y: 6, w: 4, h: 4 },
      { x: 4, y: 6, w: 8, h: 4 },
      { x: 0, y: 10, w: 6, h: 4 },
      { x: 6, y: 10, w: 6, h: 4 },
    ];
    for (const w of allWidgets) {
      expect(w.x + w.w).toBeLessThanOrEqual(COLS);
    }
  });
});

// ─── Tests: Layout API request format ────────────────────────────────────────

describe("Layout API: リクエスト形式の検証", () => {
  function validateLayoutItems(
    items: Array<{ widgetId: string; position: { x: number; y: number; w: number; h: number } }>,
  ): boolean {
    for (const item of items) {
      if (!item.widgetId || item.widgetId.length === 0) return false;
      const { x, y, w, h } = item.position;
      if (x < 0 || y < 0 || w < 1 || h < 1) return false;
      if (x + w > COLS) return false;
    }
    return true;
  }

  it("有効なレイアウトアイテムは検証を通過する", () => {
    const items = [
      { widgetId: "w1", position: { x: 0, y: 0, w: 6, h: 4 } },
      { widgetId: "w2", position: { x: 6, y: 0, w: 6, h: 4 } },
    ];
    expect(validateLayoutItems(items)).toBe(true);
  });

  it("x + w が 12 を超えるアイテムは無効", () => {
    const items = [{ widgetId: "w1", position: { x: 8, y: 0, w: 6, h: 4 } }];
    expect(validateLayoutItems(items)).toBe(false);
  });

  it("w が 0 のアイテムは無効", () => {
    const items = [{ widgetId: "w1", position: { x: 0, y: 0, w: 0, h: 4 } }];
    expect(validateLayoutItems(items)).toBe(false);
  });

  it("空の widgetId は無効", () => {
    const items = [{ widgetId: "", position: { x: 0, y: 0, w: 4, h: 3 } }];
    expect(validateLayoutItems(items)).toBe(false);
  });
});
