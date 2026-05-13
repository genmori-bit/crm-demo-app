import { describe, it, expect } from "vitest";
import { ALLOWED_COLUMNS } from "../src/lib/services/report-query-builder";

describe("ALLOWED_COLUMNS whitelist", () => {
  it("includes expected deal columns", () => {
    expect(ALLOWED_COLUMNS.deal).toBeDefined();
    expect(ALLOWED_COLUMNS.deal.dealName).toBe("商談名");
    expect(ALLOWED_COLUMNS.deal.amount).toBe("金額");
    expect(ALLOWED_COLUMNS.deal.stage).toBe("ステージ");
  });

  it("includes expected company columns", () => {
    expect(ALLOWED_COLUMNS.company).toBeDefined();
    expect(ALLOWED_COLUMNS.company.companyName).toBe("会社名");
    expect(ALLOWED_COLUMNS.company.industry).toBe("業種");
  });

  it("includes expected contact columns", () => {
    expect(ALLOWED_COLUMNS.contact).toBeDefined();
    expect(ALLOWED_COLUMNS.contact.fullName).toBe("氏名");
    expect(ALLOWED_COLUMNS.contact.email).toBe("メールアドレス");
  });

  it("includes expected activity columns", () => {
    expect(ALLOWED_COLUMNS.activity).toBeDefined();
    expect(ALLOWED_COLUMNS.activity.subject).toBe("件名");
    expect(ALLOWED_COLUMNS.activity.type).toBe("種別");
  });

  it("does not include sensitive fields", () => {
    for (const cols of Object.values(ALLOWED_COLUMNS)) {
      expect(Object.keys(cols)).not.toContain("passwordHash");
      expect(Object.keys(cols)).not.toContain("password");
      expect(Object.keys(cols)).not.toContain("deletedAt");
    }
  });

  it("covers all four object types", () => {
    expect(Object.keys(ALLOWED_COLUMNS)).toEqual(
      expect.arrayContaining(["deal", "company", "contact", "activity"])
    );
  });
});
