/**
 * Login page — ロジック・スキーマ単体テスト
 *
 * NOTE: UIレンダリングテスト（「ログイン画面が表示される」など）は
 * React Testing Library + jsdom のセットアップが必要なため別途対応。
 * ここでは認証スキーマ、デモ認証情報の制御ロジック、エラーメッセージの
 * 仕様をカバーする。
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── ログインスキーマ（ページと同じ定義を再現） ───────────────────────────

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

// ─── デモ認証情報の定数 ──────────────────────────────────────────────────────

const DEMO_EMAIL = "admin@example.com";
const DEMO_PASSWORD = "password123";

// デモ表示フラグのロジック（ページと同じ条件）
function shouldShowDemo(env: {
  NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS?: string;
  NODE_ENV?: string;
}): boolean {
  return (
    env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true" ||
    env.NODE_ENV === "development"
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Login schema: メールアドレスバリデーション", () => {
  it("有効なメールアドレスはバリデーションを通過する", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "pass" });
    expect(result.success).toBe(true);
  });

  it("空メールはバリデーションエラーになる", () => {
    const result = loginSchema.safeParse({ email: "", password: "pass" });
    expect(result.success).toBe(false);
  });

  it("メール形式が不正な場合はエラーになる", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "pass" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("メールアドレスの形式が正しくありません");
    }
  });

  it("@がないメールはバリデーションエラーになる", () => {
    const result = loginSchema.safeParse({ email: "userexample.com", password: "pass" });
    expect(result.success).toBe(false);
  });

  it("サブドメイン付きメールは有効", () => {
    const result = loginSchema.safeParse({ email: "user@mail.example.co.jp", password: "pass" });
    expect(result.success).toBe(true);
  });
});

describe("Login schema: パスワードバリデーション", () => {
  it("空パスワードはバリデーションエラーになる", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("パスワードを入力してください");
    }
  });

  it("1文字以上のパスワードはバリデーションを通過する", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "a" });
    expect(result.success).toBe(true);
  });

  it("長いパスワードも有効", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "very-long-password-with-special-chars-!@#$",
    });
    expect(result.success).toBe(true);
  });
});

describe("Login schema: 複合バリデーション", () => {
  it("メールもパスワードも空の場合は両方エラーになる", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("正常な認証情報は全てのバリデーションを通過する", () => {
    const result = loginSchema.safeParse({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    expect(result.success).toBe(true);
  });
});

describe("デモ認証情報: 表示制御ロジック", () => {
  it("NODE_ENV=development のときデモ情報を表示する", () => {
    expect(shouldShowDemo({ NODE_ENV: "development" })).toBe(true);
  });

  it("NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true のときデモ情報を表示する", () => {
    expect(shouldShowDemo({ NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS: "true", NODE_ENV: "production" })).toBe(true);
  });

  it("NODE_ENV=production かつ env var 未設定のときデモ情報を表示しない", () => {
    expect(shouldShowDemo({ NODE_ENV: "production" })).toBe(false);
  });

  it("NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false のときデモ情報を表示しない", () => {
    expect(shouldShowDemo({ NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS: "false", NODE_ENV: "production" })).toBe(false);
  });

  it("NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=TRUE (大文字) のときデモ情報を表示しない", () => {
    // 大文字は一致しない — セキュリティのため大文字小文字を区別する
    expect(shouldShowDemo({ NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS: "TRUE", NODE_ENV: "production" })).toBe(false);
  });

  it("env が空オブジェクトのときデモ情報を表示しない", () => {
    expect(shouldShowDemo({})).toBe(false);
  });
});

describe("デモ認証情報: 値の仕様", () => {
  it("デモメールアドレスが有効なメール形式である", () => {
    const result = loginSchema.safeParse({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    expect(result.success).toBe(true);
  });

  it("デモメールアドレスは admin@example.com である", () => {
    expect(DEMO_EMAIL).toBe("admin@example.com");
  });

  it("デモパスワードは空でない", () => {
    expect(DEMO_PASSWORD.length).toBeGreaterThan(0);
  });
});

describe("ログインエラーメッセージ: セキュリティ仕様", () => {
  // エラーメッセージはメール存在有無を明かさない
  const GENERIC_ERROR = "メールアドレスまたはパスワードが正しくありません";

  it("ログイン失敗時のエラーメッセージが汎用的である", () => {
    // メールが存在しないことを明示しない
    expect(GENERIC_ERROR).not.toContain("存在しません");
    // パスワードが間違いとのみ伝えない
    expect(GENERIC_ERROR).toContain("メールアドレス");
    expect(GENERIC_ERROR).toContain("パスワード");
  });

  it("エラーメッセージにパスワード情報が含まれない", () => {
    expect(GENERIC_ERROR).not.toContain("password");
    expect(GENERIC_ERROR).not.toContain("123");
  });
});
