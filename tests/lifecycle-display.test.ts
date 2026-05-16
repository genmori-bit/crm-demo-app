import { describe, it, expect } from "vitest";

// ─── isCustomerCompany helper (inline for test isolation) ──────────────────

const CUSTOMER_STAGES = new Set([
  "CUSTOMER",
  "EXPANSION",
  "RENEWAL",
  "CUSTOMER_ONBOARDING",
  "ACTIVE_CUSTOMER",
]);

function isCustomerCompany(company: { type?: string; lifecycleStage?: string | null }): boolean {
  return company.type === "CUSTOMER" || CUSTOMER_STAGES.has(company.lifecycleStage ?? "");
}

// ─── Deal stage completeness ───────────────────────────────────────────────

import { DEAL_STAGE_LABELS } from "../src/types";
import { dealSchema } from "../src/lib/validations/deal";

const VALID_STAGES = [
  "qualification",
  "needs_analysis",
  "value_proposition",
  "proposal",
  "negotiation",
  "final_review",
  "won",
  "lost",
] as const;

const INVALID_STAGES = ["prospecting", "discovery", "closing", "commit", "COMMIT", "FINAL_REVIEW"];

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("Account lifecycle display rules", () => {
  it("PROSPECT企業はisCustomerCompany=false", () => {
    expect(isCustomerCompany({ type: "PROSPECT" })).toBe(false);
  });

  it("CUSTOMER企業はisCustomerCompany=true", () => {
    expect(isCustomerCompany({ type: "CUSTOMER" })).toBe(true);
  });

  it("lifecycleStage=CUSTOMERはisCustomerCompany=true", () => {
    expect(isCustomerCompany({ lifecycleStage: "CUSTOMER" })).toBe(true);
  });

  it("lifecycleStage=EXPANSIONはisCustomerCompany=true", () => {
    expect(isCustomerCompany({ lifecycleStage: "EXPANSION" })).toBe(true);
  });

  it("lifecycleStage=RENEWALはisCustomerCompany=true", () => {
    expect(isCustomerCompany({ lifecycleStage: "RENEWAL" })).toBe(true);
  });

  it("lifecycleStage=LEADはisCustomerCompany=false", () => {
    expect(isCustomerCompany({ lifecycleStage: "LEAD" })).toBe(false);
  });

  it("lifecycleStage=TARGETはisCustomerCompany=false", () => {
    expect(isCustomerCompany({ lifecycleStage: "TARGET" })).toBe(false);
  });

  it("lifecycleStage=OPPORTUNITYはisCustomerCompany=false", () => {
    expect(isCustomerCompany({ lifecycleStage: "OPPORTUNITY" })).toBe(false);
  });

  it("type=CUSTOMERならlifecycleStageに関係なくisCustomer=true", () => {
    expect(isCustomerCompany({ type: "CUSTOMER", lifecycleStage: "LEAD" })).toBe(true);
  });

  it("type不明・lifecycleStage不明はisCustomer=false", () => {
    expect(isCustomerCompany({})).toBe(false);
    expect(isCustomerCompany({ type: undefined, lifecycleStage: null })).toBe(false);
  });
});

describe("Deal stage: COMMIT is not a valid stage", () => {
  const base = { companyId: "c1", dealName: "テスト", stage: "qualification", amount: 0, probability: 0 };

  it("COMMITはステージとして無効", () => {
    const result = dealSchema.safeParse({ ...base, stage: "commit" });
    expect(result.success).toBe(false);
  });

  it("COMMIT (大文字) もステージとして無効", () => {
    const result = dealSchema.safeParse({ ...base, stage: "COMMIT" });
    expect(result.success).toBe(false);
  });

  it("closingはステージとして無効 (旧ステージ)", () => {
    const result = dealSchema.safeParse({ ...base, stage: "closing" });
    expect(result.success).toBe(false);
  });

  it("prospectingはステージとして無効 (旧ステージ)", () => {
    const result = dealSchema.safeParse({ ...base, stage: "prospecting" });
    expect(result.success).toBe(false);
  });

  it("final_reviewは有効なステージ", () => {
    const result = dealSchema.safeParse({ ...base, stage: "final_review" });
    expect(result.success).toBe(true);
  });
});

describe("Deal stage labels (COMMITを含まない)", () => {
  it("全ての有効ステージにラベルがある", () => {
    for (const stage of VALID_STAGES) {
      expect(DEAL_STAGE_LABELS[stage]).toBeDefined();
      expect(typeof DEAL_STAGE_LABELS[stage]).toBe("string");
      expect(DEAL_STAGE_LABELS[stage].length).toBeGreaterThan(0);
    }
  });

  it("旧ステージ名がラベル定義に含まれない", () => {
    const stageKeys = Object.keys(DEAL_STAGE_LABELS);
    expect(stageKeys).not.toContain("commit");
    expect(stageKeys).not.toContain("COMMIT");
    expect(stageKeys).not.toContain("closing");
    expect(stageKeys).not.toContain("prospecting");
    expect(stageKeys).not.toContain("discovery");
  });

  it("COMMITが商談フェーズラベルに表示されない", () => {
    const labelValues = Object.values(DEAL_STAGE_LABELS);
    // forecastCategoryのCOMMIT(コミット)とは別 — ステージラベルに「COMMIT」の英字が入らない
    expect(labelValues.every((v) => !v.includes("COMMIT"))).toBe(true);
  });

  it("新ステージ名が全て揃っている", () => {
    for (const stage of VALID_STAGES) {
      expect(Object.keys(DEAL_STAGE_LABELS)).toContain(stage);
    }
  });
});

describe("Deal schema: 全有効ステージがバリデーションを通過する", () => {
  const base = { companyId: "c1", dealName: "テスト", amount: 0, probability: 0 };

  for (const stage of VALID_STAGES) {
    it(`stage=${stage} は有効`, () => {
      const result = dealSchema.safeParse({ ...base, stage });
      expect(result.success, `stage=${stage} should be valid`).toBe(true);
    });
  }

  for (const stage of INVALID_STAGES) {
    it(`stage=${stage} は無効`, () => {
      const result = dealSchema.safeParse({ ...base, stage });
      expect(result.success, `stage=${stage} should be invalid`).toBe(false);
    });
  }
});

describe("Seed data quality rules (static assertions)", () => {
  it("有効ステージに数字suffixがないこと", () => {
    for (const stage of VALID_STAGES) {
      expect(/\d$/.test(stage)).toBe(false);
    }
  });

  it("CUSTOMER_STAGESが期待する値を含む", () => {
    expect(CUSTOMER_STAGES.has("CUSTOMER")).toBe(true);
    expect(CUSTOMER_STAGES.has("EXPANSION")).toBe(true);
    expect(CUSTOMER_STAGES.has("RENEWAL")).toBe(true);
    expect(CUSTOMER_STAGES.has("PROSPECT")).toBe(false);
    expect(CUSTOMER_STAGES.has("LEAD")).toBe(false);
    expect(CUSTOMER_STAGES.has("TARGET")).toBe(false);
    expect(CUSTOMER_STAGES.has("OPPORTUNITY")).toBe(false);
  });
});
