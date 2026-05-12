import { describe, it, expect } from "vitest";

// Simulated aggregation logic extracted from dashboard API
function computeActiveDealsStats(deals: { amount: number; stage: string }[]) {
  const active = deals.filter((d) => !["won", "lost"].includes(d.stage));
  return {
    count: active.length,
    totalAmount: active.reduce((sum, d) => sum + d.amount, 0),
  };
}

function groupDealsByStage(deals: { stage: string; amount: number }[]) {
  const groups: Record<string, { count: number; totalAmount: number }> = {};
  for (const d of deals) {
    if (!groups[d.stage]) groups[d.stage] = { count: 0, totalAmount: 0 };
    groups[d.stage].count++;
    groups[d.stage].totalAmount += d.amount;
  }
  return groups;
}

function isClosingThisMonth(expectedCloseDate: string, referenceDate: Date): boolean {
  const d = new Date(expectedCloseDate);
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth()
  );
}

describe("Dashboard aggregation logic", () => {
  const sampleDeals = [
    { stage: "lead", amount: 100000 },
    { stage: "proposal", amount: 500000 },
    { stage: "won", amount: 800000 },
    { stage: "lost", amount: 300000 },
    { stage: "negotiation", amount: 1200000 },
  ];

  describe("computeActiveDealsStats", () => {
    it("counts only non-won/lost deals", () => {
      const result = computeActiveDealsStats(sampleDeals);
      expect(result.count).toBe(3);
    });

    it("sums amounts of active deals only", () => {
      const result = computeActiveDealsStats(sampleDeals);
      expect(result.totalAmount).toBe(100000 + 500000 + 1200000);
    });

    it("returns 0 for empty deals", () => {
      const result = computeActiveDealsStats([]);
      expect(result.count).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it("returns 0 when all deals are won/lost", () => {
      const result = computeActiveDealsStats([
        { stage: "won", amount: 1000 },
        { stage: "lost", amount: 2000 },
      ]);
      expect(result.count).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe("groupDealsByStage", () => {
    it("groups correctly", () => {
      const result = groupDealsByStage(sampleDeals);
      expect(result.lead.count).toBe(1);
      expect(result.proposal.count).toBe(1);
      expect(result.won.count).toBe(1);
      expect(result.lost.count).toBe(1);
      expect(result.negotiation.count).toBe(1);
    });

    it("sums amounts per stage", () => {
      const deals = [
        { stage: "proposal", amount: 300000 },
        { stage: "proposal", amount: 200000 },
        { stage: "lead", amount: 100000 },
      ];
      const result = groupDealsByStage(deals);
      expect(result.proposal.totalAmount).toBe(500000);
      expect(result.lead.totalAmount).toBe(100000);
    });

    it("handles empty input", () => {
      const result = groupDealsByStage([]);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe("isClosingThisMonth", () => {
    const ref = new Date("2026-05-12");

    it("returns true for same month", () => {
      expect(isClosingThisMonth("2026-05-31", ref)).toBe(true);
    });

    it("returns false for next month", () => {
      expect(isClosingThisMonth("2026-06-01", ref)).toBe(false);
    });

    it("returns false for previous month", () => {
      expect(isClosingThisMonth("2026-04-30", ref)).toBe(false);
    });

    it("returns false for next year same month", () => {
      expect(isClosingThisMonth("2027-05-15", ref)).toBe(false);
    });
  });
});
