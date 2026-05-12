import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDate, formatAmount, isOverdue, isDueSoon } from "../src/lib/utils";

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
