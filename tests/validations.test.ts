import { describe, it, expect } from "vitest";
import { companySchema } from "../src/lib/validations/company";
import { contactSchema } from "../src/lib/validations/contact";
import { dealSchema } from "../src/lib/validations/deal";
import { activitySchema } from "../src/lib/validations/activity";
import { taskSchema } from "../src/lib/validations/task";

// ─── Company ───────────────────────────────────────────────────────────────

describe("companySchema", () => {
  it("passes with required fields only", () => {
    const result = companySchema.safeParse({ companyName: "株式会社ABC", status: "prospect" });
    expect(result.success).toBe(true);
  });

  it("fails when companyName is empty", () => {
    const result = companySchema.safeParse({ companyName: "", status: "prospect" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("会社名は必須です");
  });

  it("fails with invalid website URL", () => {
    const result = companySchema.safeParse({ companyName: "ABC", status: "prospect", website: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("passes with empty website (treated as optional)", () => {
    const result = companySchema.safeParse({ companyName: "ABC", status: "prospect", website: "" });
    expect(result.success).toBe(true);
  });

  it("passes all valid statuses", () => {
    for (const status of ["prospect", "negotiating", "active", "lost", "dormant"]) {
      const result = companySchema.safeParse({ companyName: "ABC", status });
      expect(result.success, `status=${status}`).toBe(true);
    }
  });

  it("fails with invalid status", () => {
    const result = companySchema.safeParse({ companyName: "ABC", status: "unknown" });
    expect(result.success).toBe(false);
  });
});

// ─── Contact ───────────────────────────────────────────────────────────────

describe("contactSchema", () => {
  it("passes with required fields", () => {
    const result = contactSchema.safeParse({ companyId: "cuid1", fullName: "田中 太郎" });
    expect(result.success).toBe(true);
  });

  it("fails when fullName is empty", () => {
    const result = contactSchema.safeParse({ companyId: "cuid1", fullName: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("氏名は必須です");
  });

  it("fails when companyId is empty", () => {
    const result = contactSchema.safeParse({ companyId: "", fullName: "田中" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("会社は必須です");
  });

  it("accepts valid email", () => {
    const result = contactSchema.safeParse({ companyId: "c1", fullName: "田中", email: "tanaka@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({ companyId: "c1", fullName: "田中", email: "not-email" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("メールアドレスの形式が正しくありません");
  });

  it("accepts empty email as optional", () => {
    const result = contactSchema.safeParse({ companyId: "c1", fullName: "田中", email: "" });
    expect(result.success).toBe(true);
  });
});

// ─── Deal ──────────────────────────────────────────────────────────────────

describe("dealSchema", () => {
  const base = { companyId: "c1", dealName: "テスト商談", stage: "lead", amount: 0, probability: 0 };

  it("passes with required fields", () => {
    const result = dealSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("fails when dealName is empty", () => {
    const result = dealSchema.safeParse({ ...base, dealName: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("商談名は必須です");
  });

  it("fails when amount is negative", () => {
    const result = dealSchema.safeParse({ ...base, amount: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("金額は0以上で入力してください");
  });

  it("passes when amount is 0 (boundary)", () => {
    const result = dealSchema.safeParse({ ...base, amount: 0 });
    expect(result.success).toBe(true);
  });

  it("passes when amount is large positive", () => {
    const result = dealSchema.safeParse({ ...base, amount: 100000000 });
    expect(result.success).toBe(true);
  });

  it("fails when probability is below 0", () => {
    const result = dealSchema.safeParse({ ...base, probability: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("確度は0以上で入力してください");
  });

  it("fails when probability is above 100", () => {
    const result = dealSchema.safeParse({ ...base, probability: 101 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("確度は100以下で入力してください");
  });

  it("passes when probability is 0 (boundary)", () => {
    const result = dealSchema.safeParse({ ...base, probability: 0 });
    expect(result.success).toBe(true);
  });

  it("passes when probability is 100 (boundary)", () => {
    const result = dealSchema.safeParse({ ...base, probability: 100 });
    expect(result.success).toBe(true);
  });

  it("passes all valid stages", () => {
    for (const stage of ["lead", "hearing", "proposal", "negotiation", "won", "lost"]) {
      const result = dealSchema.safeParse({ ...base, stage });
      expect(result.success, `stage=${stage}`).toBe(true);
    }
  });

  it("coerces string amount to number", () => {
    const result = dealSchema.safeParse({ ...base, amount: "500000" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(500000);
  });
});

// ─── Activity ──────────────────────────────────────────────────────────────

describe("activitySchema", () => {
  const base = { type: "phone", subject: "電話した", activityDate: "2026-05-10" };

  it("passes with required fields", () => {
    const result = activitySchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("fails when subject is empty", () => {
    const result = activitySchema.safeParse({ ...base, subject: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("件名は必須です");
  });

  it("fails when activityDate is empty", () => {
    const result = activitySchema.safeParse({ ...base, activityDate: "" });
    expect(result.success).toBe(false);
  });

  it("passes all activity types", () => {
    for (const type of ["phone", "email", "meeting", "note", "other"]) {
      const result = activitySchema.safeParse({ ...base, type });
      expect(result.success, `type=${type}`).toBe(true);
    }
  });
});

// ─── Task ──────────────────────────────────────────────────────────────────

describe("taskSchema", () => {
  const base = { title: "テストタスク", priority: "medium", status: "todo" };

  it("passes with required fields", () => {
    const result = taskSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("fails when title is empty", () => {
    const result = taskSchema.safeParse({ ...base, title: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("タイトルは必須です");
  });

  it("passes all priorities", () => {
    for (const priority of ["low", "medium", "high"]) {
      const result = taskSchema.safeParse({ ...base, priority });
      expect(result.success, `priority=${priority}`).toBe(true);
    }
  });

  it("passes all statuses", () => {
    for (const status of ["todo", "in_progress", "done"]) {
      const result = taskSchema.safeParse({ ...base, status });
      expect(result.success, `status=${status}`).toBe(true);
    }
  });
});

// ─── Email edge cases ──────────────────────────────────────────────────────

describe("email validation edge cases", () => {
  const cases: [string, boolean][] = [
    ["user@example.com", true],
    ["user+tag@sub.domain.co.jp", true],
    ["", true],         // empty is allowed (optional)
    ["notanemail", false],
    ["@domain.com", false],
    ["user@", false],
    ["user @example.com", false],
  ];

  for (const [email, expected] of cases) {
    it(`email "${email}" should ${expected ? "pass" : "fail"}`, () => {
      const result = contactSchema.safeParse({ companyId: "c1", fullName: "田中", email });
      expect(result.success).toBe(expected);
    });
  }
});
