# Sales CRM

小規模営業チーム向けのシンプルなCRMアプリケーションです。

---

## 起動方法

### 前提条件

- Node.js 18 以上
- npm 9 以上

### セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 環境変数の設定
cp .env.example .env
# .env の NEXTAUTH_SECRET を適切な値に変更すること

# 3. データベースのマイグレーション
npm run db:migrate

# 4. サンプルデータの投入（任意）
npm run db:seed

# 5. 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

### 初期ログイン情報

| 項目 | 値 |
|------|-----|
| メールアドレス | admin@example.com |
| パスワード | password123 |

---

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|------------|
| `DATABASE_URL` | SQLite データベースのパス | `file:./dev.db` |
| `NEXTAUTH_SECRET` | JWT 署名用のシークレットキー | 開発用の仮値 |
| `NEXTAUTH_URL` | アプリのベースURL | `http://localhost:3000` |

---

## 主要コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLint の実行
npm run typecheck    # TypeScript の型チェック
npm run test         # テストの実行
npm run db:migrate   # DBマイグレーション実行
npm run db:seed      # サンプルデータ投入
npm run db:reset     # DB リセット + シード再投入
```

---

## 主要機能

### ダッシュボード (`/dashboard`)
- 顧客企業数・担当者数・進行中商談数・商談金額合計の統計カード
- 商談ステージ別の件数・金額一覧
- 今月クローズ予定の商談一覧
- 未完了タスク一覧（優先度順）
- 最近の活動履歴

### 顧客企業管理 (`/companies`)
- 一覧・詳細・新規作成・編集・削除
- キーワード検索（会社名・担当者・業界）
- ステータス・業界フィルター
- 関連担当者・商談・活動履歴・タスクの表示

### 担当者管理 (`/contacts`)
- 一覧・詳細・新規作成・編集・削除
- 会社紐付け・主要担当者フラグ
- キーワード検索

### 商談管理 (`/deals`)
- 一覧・詳細・新規作成・編集・削除
- ステージフィルター
- 金額・クローズ予定日ソート
- 関連活動履歴・タスクの表示

### 活動履歴管理 (`/activities`)
- 一覧・新規追加・削除
- 電話 / メール / 会議 / メモ / その他の種別
- 会社・担当者・商談との紐付け

### タスク管理 (`/tasks`)
- 一覧・新規作成・編集・削除
- ワンクリックで完了切り替え
- 期限切れタスクの強調表示
- 優先度・ステータスフィルター

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript (strict) |
| スタイリング | Tailwind CSS |
| フォーム | React Hook Form + Zod |
| DB ORM | Prisma 6 |
| データベース | SQLite |
| 認証 | NextAuth.js v5 (Credentials) |
| テスト | Vitest |

---

## ディレクトリ構成

```
crm/
├── prisma/
│   ├── schema.prisma       # DBスキーマ
│   ├── seed.ts             # サンプルデータ
│   └── migrations/         # マイグレーション履歴
├── src/
│   ├── app/
│   │   ├── (auth)/         # 認証不要ページ（ログイン）
│   │   ├── (dashboard)/    # 認証必要ページ群
│   │   ├── api/            # API Routes
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/         # Sidebar, Header
│   │   └── ui/             # 再利用可能UIコンポーネント
│   ├── lib/
│   │   ├── api-client.ts   # フロント用APIクライアント
│   │   ├── auth.ts         # NextAuth設定
│   │   ├── prisma.ts       # Prismaクライアント
│   │   ├── utils.ts        # ユーティリティ関数
│   │   └── validations/    # Zodスキーマ
│   └── types/
│       └── index.ts        # 共通型定義・ラベルマップ
└── tests/
    ├── validations.test.ts          # バリデーション単体テスト
    ├── utils.test.ts                # ユーティリティ関数テスト
    └── dashboard-aggregation.test.ts # 集計ロジックテスト
```

---

## DBモデル概要

```
User          ログインユーザー
Company       顧客企業
  ├── Contact 担当者（会社に所属）
  ├── Deal    商談（会社・担当者に紐付く）
  ├── Activity 活動履歴（会社・担当者・商談に紐付く）
  └── Task    タスク（会社・商談に紐付く）
```

削除時の動作:
- Company 削除 → Contact/Deal は `CASCADE`（一緒に削除）
- Deal/Contact 削除 → Activity/Task は `SetNull`（紐付けを解除して保持）

---

## 今後の拡張案

### 機能拡張
- **メール連携**: Gmail / Outlook からの活動履歴自動取り込み
- **カレンダー連携**: Google Calendar との同期
- **AI 機能**: 商談要約・次回アクション自動提案
- **レポート**: CSV/Excel エクスポート、グラフ表示
- **パイプラインビュー**: ドラッグ&ドロップ式のカンバンボード
- **通知機能**: 期限切れタスクのリマインダー
- **モバイルアプリ**: PWA 対応、または React Native 版

### 技術的改善
- **多言語対応**: i18n の導入
- **リアルタイム更新**: WebSocket / Server-Sent Events
- **全文検索**: Algolia または Typesense の導入
- **ファイル添付**: S3/R2 を使った商談・活動へのファイル添付
- **PostgreSQL 移行**: 本番環境向けのDB切り替え
- **E2E テスト**: Playwright による統合テスト
- **OpenAPI / tRPC**: 型安全な API 定義

---

## ⚠️ 本番利用前に必要なセキュリティ対応

> **このアプリは MVP（最小限の実装）です。本番環境で利用する前に、必ず以下を実施してください。**

### 必須対応

1. **NEXTAUTH_SECRET を強固なランダム文字列に変更する**
   ```bash
   openssl rand -base64 32
   ```

2. **初期パスワードを変更する**
   - `admin@example.com` のパスワードを seed の `password123` から変更する

3. **HTTPS 化する**
   - 本番環境では必ず HTTPS で提供する
   - `NEXTAUTH_URL` を `https://` に変更する

4. **権限管理・ロール管理を実装する**
   - 現在は全ユーザーが全データにアクセス可能
   - 営業担当者ごとのデータ分離を実装する

5. **監査ログを実装する**
   - 誰がいつどのデータを作成・更新・削除したかを記録する

6. **レート制限を設定する**
   - ログイン試行のブルートフォース対策
   - API エンドポイントのレート制限

7. **SQLite から PostgreSQL に移行する**
   - SQLite は本番環境での同時接続に適していない

8. **依存パッケージの脆弱性を修正する**
   ```bash
   npm audit fix
   ```

9. **環境変数を安全に管理する**
   - `.env` ファイルを Git にコミットしない（`.gitignore` に含まれていることを確認）
   - 本番環境では環境変数管理サービスを利用する

10. **セキュリティヘッダーを設定する**
    - CSP (Content Security Policy)
    - HSTS
    - X-Frame-Options

---

## ライセンス

MIT
