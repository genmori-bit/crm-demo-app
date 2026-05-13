import { describe, it, expect } from "vitest";

// Unit tests for data quality logic (without DB)
function assessCompanyQuality(company: {
  companyName: string;
  industry?: string | null;
  phone?: string | null;
}) {
  const issues: string[] = [];
  if (!company.industry) issues.push("missing_industry");
  if (!company.phone) issues.push("missing_phone");
  return issues;
}

function assessDealQuality(deal: {
  dealName: string;
  amount: number;
  expectedCloseDate?: Date | null;
  nextAction?: string | null;
  stage: string;
}) {
  const issues: string[] = [];
  if (deal.amount === 0) issues.push("zero_amount");
  if (!deal.expectedCloseDate) issues.push("missing_close_date");
  if (!deal.nextAction && deal.stage !== "won" && deal.stage !== "lost") {
    issues.push("missing_next_action");
  }
  return issues;
}

describe("Company quality checks", () => {
  it("flags missing industry", () => {
    const issues = assessCompanyQuality({ companyName: "テスト", phone: "03-1234-5678" });
    expect(issues).toContain("missing_industry");
  });

  it("flags missing phone", () => {
    const issues = assessCompanyQuality({ companyName: "テスト", industry: "IT" });
    expect(issues).toContain("missing_phone");
  });

  it("returns no issues for complete data", () => {
    const issues = assessCompanyQuality({
      companyName: "テスト",
      industry: "IT",
      phone: "03-1234-5678",
    });
    expect(issues).toHaveLength(0);
  });
});

describe("Deal quality checks", () => {
  it("flags zero amount", () => {
    const issues = assessDealQuality({
      dealName: "テスト商談",
      amount: 0,
      stage: "proposal",
      expectedCloseDate: new Date(),
      nextAction: "提案書送付",
    });
    expect(issues).toContain("zero_amount");
  });

  it("flags missing close date", () => {
    const issues = assessDealQuality({
      dealName: "テスト商談",
      amount: 100000,
      stage: "proposal",
      nextAction: "提案書送付",
    });
    expect(issues).toContain("missing_close_date");
  });

  it("flags missing next action for active deals", () => {
    const issues = assessDealQuality({
      dealName: "テスト商談",
      amount: 100000,
      stage: "proposal",
      expectedCloseDate: new Date(),
    });
    expect(issues).toContain("missing_next_action");
  });

  it("does not flag missing next action for won/lost", () => {
    const wonIssues = assessDealQuality({ dealName: "テスト", amount: 0, stage: "won" });
    const lostIssues = assessDealQuality({ dealName: "テスト", amount: 0, stage: "lost" });
    expect(wonIssues).not.toContain("missing_next_action");
    expect(lostIssues).not.toContain("missing_next_action");
  });
});
