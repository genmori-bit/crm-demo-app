import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatAmount,
  isOverdue,
  isDueSoon,
  formatCurrencyShort,
  formatNumberShort,
  formatPercent,
  formatScore,
  formatMetricValue,
} from "../src/lib/utils";

describe("formatDate", () => {
  it("formats a date string correctly", () => {
    expect(formatDate("2026-05-12")).toBe("2026/05/12");
  });

  it("returns '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });
});

describe("formatAmount", () => {
  it("formats zero", () => {
    expect(formatAmount(0)).toMatch(/0/);
  });

  it("formats large amounts with commas", () => {
    expect(formatAmount(1000000)).toMatch(/1,000,000/);
  });

  it("formats negative amount", () => {
    expect(formatAmount(-5000)).toMatch(/5,000/);
  });

  it("includes currency symbol", () => {
    const result = formatAmount(100);
    // ¥ (U+00A5) or ￥ (U+FFE5) depending on locale
    expect(result).toMatch(/[¥￥]/);
  });
});

describe("isOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for past date", () => {
    expect(isOverdue("2026-05-11")).toBe(true);
  });

  it("returns false for future date", () => {
    expect(isOverdue("2026-05-13")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe("isDueSoon", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for date within 3 days", () => {
    expect(isDueSoon("2026-05-13")).toBe(true);
  });

  it("returns false for past date", () => {
    expect(isDueSoon("2026-05-11")).toBe(false);
  });

  it("returns false for date beyond 3 days", () => {
    expect(isDueSoon("2026-05-20")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isDueSoon(null)).toBe(false);
  });
});

// ── formatCurrencyShort ──────────────────────────────────────────────────────

describe("formatCurrencyShort", () => {
  it("returns — for null", () => {
    expect(formatCurrencyShort(null)).toBe("—");
  });
  it("returns — for undefined", () => {
    expect(formatCurrencyShort(undefined)).toBe("—");
  });
  it("returns ¥0 for zero", () => {
    expect(formatCurrencyShort(0)).toBe("¥0");
  });
  it("600000 → ¥60万", () => {
    expect(formatCurrencyShort(600000)).toBe("¥60万");
  });
  it("14620000 → ¥1,462万", () => {
    expect(formatCurrencyShort(14620000)).toBe("¥1,462万");
  });
  it("44577 → ¥4.5万", () => {
    expect(formatCurrencyShort(44577)).toBe("¥4.5万");
  });
  it("1_0000_0000 → ¥1億", () => {
    expect(formatCurrencyShort(100000000)).toBe("¥1億");
  });
  it("2_5000_0000 → ¥2.5億", () => {
    expect(formatCurrencyShort(250000000)).toBe("¥2.5億");
  });
  it("small amount (< 10000) → full ¥ display", () => {
    expect(formatCurrencyShort(5000)).toMatch(/¥5,000/);
  });
  it("negative value shows minus sign", () => {
    expect(formatCurrencyShort(-600000)).toBe("-¥60万");
  });
});

// ── formatNumberShort ────────────────────────────────────────────────────────

describe("formatNumberShort", () => {
  it("returns — for null", () => {
    expect(formatNumberShort(null)).toBe("—");
  });
  it("formats 1000 with comma", () => {
    expect(formatNumberShort(1000)).toBe("1,000");
  });
  it("formats 0", () => {
    expect(formatNumberShort(0)).toBe("0");
  });
});

// ── formatPercent ────────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("returns — for null", () => {
    expect(formatPercent(null)).toBe("—");
  });
  it("formats with 1 decimal by default", () => {
    expect(formatPercent(23.456)).toBe("23.5%");
  });
  it("formats with 0 decimals", () => {
    expect(formatPercent(50, 0)).toBe("50%");
  });
});

// ── formatScore ──────────────────────────────────────────────────────────────

describe("formatScore", () => {
  it("returns — for null", () => {
    expect(formatScore(null)).toBe("—");
  });
  it("rounds to integer", () => {
    expect(formatScore(75.7)).toBe("76");
  });
  it("formats zero as 0", () => {
    expect(formatScore(0)).toBe("0");
  });
});

// ── formatMetricValue ────────────────────────────────────────────────────────

describe("formatMetricValue", () => {
  it("returns — for null value", () => {
    expect(formatMetricValue(null, "currency_short")).toBe("—");
  });
  it("formats currency_short", () => {
    expect(formatMetricValue(600000, "currency_short")).toBe("¥60万");
  });
  it("formats number", () => {
    expect(formatMetricValue(1000, "number")).toBe("1,000");
  });
  it("formats percent", () => {
    expect(formatMetricValue(25.5, "percent")).toBe("25.5%");
  });
  it("formats text with unit", () => {
    expect(formatMetricValue("12", "text", "件")).toBe("12 件");
  });
});
