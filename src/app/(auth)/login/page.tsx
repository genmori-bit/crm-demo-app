"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

// Show demo credentials in development or when env var is set
const SHOW_DEMO =
  process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true" ||
  process.env.NODE_ENV === "development";

// ─── AuthLogo ─────────────────────────────────────────────────────────────────

function AuthLogo({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isDark
            ? "bg-white/15 border border-white/20"
            : "bg-primary-500 shadow-sm"
        }`}
      >
        {/* Layers icon */}
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          />
        </svg>
      </div>
      <span
        className={`text-sm font-bold tracking-tight ${
          isDark ? "text-white" : "text-primary-800"
        }`}
      >
        Nexus CRM
      </span>
    </div>
  );
}

// ─── MiniProductPreview ────────────────────────────────────────────────────────

function MiniProductPreview() {
  return (
    <div className="mt-10 space-y-3">
      {/* Pipeline bar */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-xs font-medium">営業パイプライン</span>
          <span className="text-white text-sm font-bold">¥142M</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "初期確認", pct: 85, color: "bg-primary-300" },
            { label: "提案", pct: 60, color: "bg-primary-400" },
            { label: "交渉", pct: 38, color: "bg-primary-200" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="text-white/50 text-2xs w-12 shrink-0">{row.label}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white/10 border border-white/15 rounded-xl p-3">
          <p className="text-white/55 text-2xs mb-1">今月受注</p>
          <p className="text-white text-base font-bold leading-none">12件</p>
          <p className="text-green-300 text-2xs mt-1.5">↑ +18%</p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-xl p-3">
          <p className="text-white/55 text-2xs mb-1">リード</p>
          <p className="text-white text-base font-bold leading-none">38件</p>
          <p className="text-primary-300 text-2xs mt-1.5">高スコア</p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-xl p-3">
          <p className="text-white/55 text-2xs mb-1">活動</p>
          <p className="text-white text-base font-bold leading-none">94件</p>
          <p className="text-white/40 text-2xs mt-1.5">今週</p>
        </div>
      </div>
    </div>
  );
}

// ─── ProductBrandPanel ─────────────────────────────────────────────────────────

function ProductBrandPanel() {
  const features = [
    {
      label: "CRM",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Marketing Automation",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Analytics",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Object Manager",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="hidden lg:flex flex-col w-[55%] bg-primary-800 text-white relative overflow-hidden p-12">
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-primary-900/70 to-transparent"
        aria-hidden="true"
      />
      {/* Right edge shimmer */}
      <div
        className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <AuthLogo variant="dark" />

        {/* Main copy */}
        <div className="mt-14 flex-1">
          <h1 className="text-[2.1rem] font-bold leading-snug tracking-tight">
            営業とマーケティングを、
            <br />
            <span className="text-primary-300">ひとつの顧客体験</span>に。
          </h1>
          <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-xs">
            CRM・MA・レポート・ダッシュボード・オブジェクト管理を統合した
            B2B向け統合営業プラットフォーム。
          </p>

          {/* Feature badges */}
          <div className="mt-8 flex flex-wrap gap-2">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1"
              >
                <span className="text-primary-300">{f.icon}</span>
                <span className="text-xs font-medium text-white/80">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Mini product preview */}
          <MiniProductPreview />
        </div>

        {/* Bottom tagline */}
        <p className="text-xs text-white/30 mt-8 tracking-wide">
          Enterprise-grade CRM/MA platform for B2B sales teams
        </p>
      </div>
    </div>
  );
}

// ─── DemoCredentialsCard ──────────────────────────────────────────────────────

function DemoCredentialsCard({
  onFill,
}: {
  onFill: (email: string, password: string) => void;
}) {
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  const copyToClipboard = async (text: string, field: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // clipboard API not available — silently ignore
    }
  };

  const CheckIcon = () => (
    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
  const CopyIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4" role="region" aria-label="デモ環境情報">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-amber-800">デモ環境で試す</p>
        <span className="ml-auto text-2xs text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
          DEMO
        </span>
      </div>

      {/* Credentials */}
      <div className="space-y-2 mb-4">
        {/* Email row */}
        <div className="flex items-center justify-between gap-3 py-1.5 px-2.5 bg-white/70 border border-amber-200 rounded-lg">
          <span className="text-2xs font-medium text-amber-700 shrink-0 w-14">管理者</span>
          <code className="text-xs text-amber-900 font-mono flex-1 truncate">
            admin@example.com
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard("admin@example.com", "email")}
            className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
            aria-label="メールアドレスをコピー"
          >
            {copiedField === "email" ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        {/* Password row */}
        <div className="flex items-center justify-between gap-3 py-1.5 px-2.5 bg-white/70 border border-amber-200 rounded-lg">
          <span className="text-2xs font-medium text-amber-700 shrink-0 w-14">パスワード</span>
          <code className="text-xs text-amber-900 font-mono flex-1">
            password123
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard("password123", "password")}
            className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
            aria-label="パスワードをコピー"
          >
            {copiedField === "password" ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>

      {/* Fill button */}
      <button
        type="button"
        onClick={() => onFill("admin@example.com", "password123")}
        className="w-full h-8 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 border border-amber-300 rounded-lg transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus:outline-none"
      >
        フォームに入力する
      </button>
    </div>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: false });
    setValue("password", password, { shouldValidate: false });
    setError("");
  };

  const inputBase =
    "block w-full h-11 rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-100 focus:outline-none";
  const inputNormal =
    "border-slate-300 focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(1,118,211,0.15)]";
  const inputError =
    "border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]";

  return (
    <div className="w-full max-w-sm">
      {/* Login card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_32px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Card top stripe */}
        <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />

        {/* Card header */}
        <div className="px-8 pt-7 pb-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ログイン</h2>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            アカウント情報を入力してワークスペースにアクセスしてください。
          </p>
        </div>

        <div className="px-8 pb-8 pt-5">
          {/* Auth error */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <svg
                className="w-4 h-4 mt-0.5 shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            aria-busy={isSubmitting}
            noValidate
          >
            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                {...register("email")}
              />
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  パスワード
                </label>
                <button
                  type="button"
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline focus-visible:ring-1 focus-visible:ring-primary-400 focus:outline-none rounded"
                >
                  パスワードをお忘れですか？
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`${inputBase} pr-11 ${errors.password ? inputError : inputNormal}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "パスワードを非表示にする" : "パスワードを表示する"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:ring-1 focus-visible:ring-primary-400 focus:outline-none rounded"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full h-11 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:bg-primary-700 transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus:outline-none disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </button>
          </form>

          {/* Demo credentials — visible only in dev or when env var is set */}
          {SHOW_DEMO && <DemoCredentialsCard onFill={fillDemo} />}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400 text-center select-none">
        © {new Date().getFullYear()} Nexus CRM. All rights reserved.
      </p>
    </div>
  );
}

// ─── LoginPage ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel (desktop only) */}
      <ProductBrandPanel />

      {/* Right: login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <AuthLogo variant="light" />
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
