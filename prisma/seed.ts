import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.dashboardWidget.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.report.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.dealTag.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.dataTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const hashedPassword = await bcrypt.hash("password123", 12);
  const [adminUser] = await Promise.all([
    prisma.user.create({
      data: { email: "admin@example.com", name: "管理者", passwordHash: hashedPassword, role: "ADMIN" },
    }),
    prisma.user.create({
      data: { email: "manager@example.com", name: "田中マネージャー", passwordHash: hashedPassword, role: "MANAGER" },
    }),
    prisma.user.create({
      data: { email: "sales1@example.com", name: "山田 営業一郎", passwordHash: hashedPassword, role: "SALES" },
    }),
    prisma.user.create({
      data: { email: "sales2@example.com", name: "佐藤 営業花子", passwordHash: hashedPassword, role: "SALES" },
    }),
    prisma.user.create({
      data: { email: "sales3@example.com", name: "鈴木 営業次郎", passwordHash: hashedPassword, role: "SALES" },
    }),
  ]);

  // Tags
  const tags = await Promise.all([
    prisma.dataTag.create({ data: { name: "重点顧客", color: "#0176d3" } }),
    prisma.dataTag.create({ data: { name: "要フォロー", color: "#dd7a01" } }),
    prisma.dataTag.create({ data: { name: "競合あり", color: "#ea001e" } }),
    prisma.dataTag.create({ data: { name: "リピーター", color: "#2e844a" } }),
    prisma.dataTag.create({ data: { name: "大手", color: "#6b34b0" } }),
    prisma.dataTag.create({ data: { name: "スタートアップ", color: "#0e7490" } }),
    prisma.dataTag.create({ data: { name: "パートナー", color: "#0f766e" } }),
    prisma.dataTag.create({ data: { name: "海外展開", color: "#1d4ed8" } }),
    prisma.dataTag.create({ data: { name: "上場企業", color: "#7c3aed" } }),
    prisma.dataTag.create({ data: { name: "成長企業", color: "#15803d" } }),
  ]);
  void adminUser; void tags;

  // Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        companyName: "株式会社テクノソリューション",
        website: "https://technosolution.example.com",
        industry: "IT・ソフトウェア",
        employeeSize: "100-500名",
        status: "active",
        ownerName: "田中 太郎",
        memo: "DX推進に積極的。予算は潤沢。意思決定が速い。",
      },
    }),
    prisma.company.create({
      data: {
        companyName: "グローバル商事株式会社",
        website: "https://globalshoji.example.com",
        industry: "商社・卸売",
        employeeSize: "1000名以上",
        status: "prospect",
        ownerName: "鈴木 花子",
        memo: "大手商社。意思決定に時間がかかる傾向あり。",
      },
    }),
    prisma.company.create({
      data: {
        companyName: "医療法人さくら会",
        website: "https://sakurakai.example.com",
        industry: "医療・ヘルスケア",
        employeeSize: "50-100名",
        status: "negotiating",
        ownerName: "山田 健二",
        memo: "セキュリティ要件が厳しい。導入実績を重視する。",
      },
    }),
    prisma.company.create({
      data: {
        companyName: "有限会社フードサービス",
        website: "https://foodservice.example.com",
        industry: "飲食・食品",
        employeeSize: "10-50名",
        status: "lost",
        ownerName: "佐藤 美咲",
        memo: "予算オーバーで今回は見送り。来期再挑戦予定。",
      },
    }),
    prisma.company.create({
      data: {
        companyName: "製造業株式会社みらい工業",
        website: "https://mirai-industry.example.com",
        industry: "製造・メーカー",
        employeeSize: "500-1000名",
        status: "prospect",
        ownerName: "高橋 誠",
        memo: "工場のデジタル化を検討中。IT担当者と良好な関係。",
      },
    }),
  ]);

  // Contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        companyId: companies[0].id,
        fullName: "中村 拓也",
        email: "nakamura@technosolution.example.com",
        phone: "03-1234-5678",
        department: "IT推進部",
        title: "部長",
        isPrimary: true,
        memo: "技術的な理解が深い。最終意思決定者。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[0].id,
        fullName: "伊藤 裕子",
        email: "ito@technosolution.example.com",
        phone: "03-1234-5679",
        department: "IT推進部",
        title: "担当者",
        isPrimary: false,
        memo: "実務担当者。日々の窓口はこちら。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[1].id,
        fullName: "渡辺 隆",
        email: "watanabe@globalshoji.example.com",
        phone: "03-9876-5432",
        department: "経営企画部",
        title: "課長",
        isPrimary: true,
        memo: "稟議書を作成する実務担当者。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[1].id,
        fullName: "松本 由美",
        email: "matsumoto@globalshoji.example.com",
        phone: "03-9876-5433",
        department: "情報システム部",
        title: "部長",
        isPrimary: false,
        memo: "技術評価の最終決定者。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[2].id,
        fullName: "小林 和夫",
        email: "kobayashi@sakurakai.example.com",
        phone: "06-1111-2222",
        department: "管理部",
        title: "事務長",
        isPrimary: true,
        memo: "院長への橋渡し役。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[2].id,
        fullName: "加藤 麻衣",
        email: "kato@sakurakai.example.com",
        phone: "06-1111-2223",
        department: "医療情報部",
        title: "システム管理者",
        isPrimary: false,
        memo: "技術的な要件定義を担当。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[3].id,
        fullName: "木村 大輔",
        email: "kimura@foodservice.example.com",
        phone: "06-3333-4444",
        department: "経営",
        title: "代表取締役",
        isPrimary: true,
        memo: "オーナー社長。コスト意識が高い。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[4].id,
        fullName: "橋本 浩二",
        email: "hashimoto@mirai-industry.example.com",
        phone: "052-555-6666",
        department: "生産管理部",
        title: "部長",
        isPrimary: true,
        memo: "現場のDX推進リーダー。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[4].id,
        fullName: "石田 奈緒",
        email: "ishida@mirai-industry.example.com",
        phone: "052-555-6667",
        department: "情報システム部",
        title: "担当者",
        isPrimary: false,
        memo: "技術調査を担当。",
      },
    }),
    prisma.contact.create({
      data: {
        companyId: companies[0].id,
        fullName: "福田 正樹",
        email: "fukuda@technosolution.example.com",
        phone: "03-1234-5680",
        department: "購買部",
        title: "担当者",
        isPrimary: false,
        memo: "契約・購買手続きを担当。",
      },
    }),
  ]);

  // Deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[0].id,
        dealName: "クラウドERP導入プロジェクト",
        stage: "proposal",
        amount: 5000000,
        probability: 60,
        expectedCloseDate: new Date("2026-06-30"),
        nextAction: "提案書の最終版を6/10までに提出",
        memo: "3年契約を前提とした提案。保守サポートも含む。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[1].id,
        contactId: contacts[2].id,
        dealName: "営業管理システム刷新",
        stage: "hearing",
        amount: 8000000,
        probability: 30,
        expectedCloseDate: new Date("2026-09-30"),
        nextAction: "要件定義ヒアリング（6/20予定）",
        memo: "既存システムからの移行が課題。データ移行費用を別途見積もる。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[2].id,
        contactId: contacts[4].id,
        dealName: "電子カルテ連携システム",
        stage: "negotiation",
        amount: 3200000,
        probability: 75,
        expectedCloseDate: new Date("2026-05-31"),
        nextAction: "セキュリティ要件の最終確認",
        memo: "ISMS認証対応が必須。セキュリティ監査対応が鍵。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[4].id,
        contactId: contacts[7].id,
        dealName: "工場IoTダッシュボード構築",
        stage: "lead",
        amount: 1500000,
        probability: 20,
        expectedCloseDate: new Date("2026-12-31"),
        nextAction: "初回デモを7月に設定予定",
        memo: "PoC段階。予算はまだ未確定。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[0].id,
        dealName: "セキュリティ診断サービス",
        stage: "won",
        amount: 800000,
        probability: 100,
        expectedCloseDate: new Date("2026-04-30"),
        nextAction: "契約締結済み。サービス開始準備中。",
        memo: "年間契約。来期も継続見込み。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[3].id,
        contactId: contacts[6].id,
        dealName: "POSシステム導入",
        stage: "lost",
        amount: 600000,
        probability: 0,
        expectedCloseDate: new Date("2026-03-31"),
        nextAction: "来期の予算確保を確認する",
        memo: "今期は予算不足で見送り。オーナーとの関係は良好。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[1].id,
        contactId: contacts[3].id,
        dealName: "データ分析基盤整備",
        stage: "proposal",
        amount: 12000000,
        probability: 45,
        expectedCloseDate: new Date("2026-08-31"),
        nextAction: "役員プレゼンテーション（7/15予定）",
        memo: "大型案件。競合他社も提案中。価格競争力が課題。",
      },
    }),
    prisma.deal.create({
      data: {
        companyId: companies[4].id,
        contactId: contacts[8].id,
        dealName: "在庫管理システム更新",
        stage: "hearing",
        amount: 2800000,
        probability: 40,
        expectedCloseDate: new Date("2026-10-31"),
        nextAction: "現行システムの調査訪問（7/5予定）",
        memo: "老朽化したシステムの刷新。クラウド移行も検討中。",
      },
    }),
  ]);

  // Activities
  await Promise.all([
    prisma.activity.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[0].id,
        dealId: deals[0].id,
        type: "meeting",
        subject: "提案内容のヒアリング",
        body: "中村部長と1時間のミーティング。現状の課題と要件を詳しく確認。ERPの導入範囲について合意。次回は技術者も交えたデモを実施予定。",
        activityDate: new Date("2026-05-10"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[1].id,
        dealId: deals[0].id,
        type: "email",
        subject: "提案書ドラフトの送付",
        body: "伊藤様へ提案書のドラフトをメール送付。費用感の確認を依頼。",
        activityDate: new Date("2026-05-08"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[1].id,
        contactId: contacts[2].id,
        dealId: deals[1].id,
        type: "phone",
        subject: "ヒアリング日程調整",
        body: "渡辺課長へ電話。6月20日にヒアリングMTG設定。情報システム部も参加予定とのこと。",
        activityDate: new Date("2026-05-09"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[2].id,
        contactId: contacts[4].id,
        dealId: deals[2].id,
        type: "meeting",
        subject: "セキュリティ要件確認MTG",
        body: "小林事務長・加藤氏と会議。ISMSの要件書を受領。5/25までに対応可否を回答する約束。",
        activityDate: new Date("2026-05-07"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[2].id,
        contactId: contacts[5].id,
        dealId: deals[2].id,
        type: "email",
        subject: "セキュリティ要件書受領の確認",
        body: "加藤様から送付いただいたセキュリティ要件書の内容を確認。技術チームに共有済み。",
        activityDate: new Date("2026-05-06"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[4].id,
        contactId: contacts[7].id,
        dealId: deals[3].id,
        type: "phone",
        subject: "初回電話での状況確認",
        body: "橋本部長と15分の電話。IoTダッシュボードへの関心は高いが、社内稟議に時間がかかる見込み。7月のデモを提案、前向きな返答を得た。",
        activityDate: new Date("2026-05-11"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[0].id,
        dealId: deals[4].id,
        type: "meeting",
        subject: "セキュリティ診断サービス契約締結",
        body: "正式契約書に署名。4月からサービス開始。年間8回の診断レポートを提供予定。",
        activityDate: new Date("2026-04-28"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[3].id,
        contactId: contacts[6].id,
        dealId: deals[5].id,
        type: "phone",
        subject: "失注のお詫びと来期フォロー",
        body: "木村社長へ電話。今期は見送りとなったが、来期の予算申請に向けて情報提供を続けることを約束。良好な関係を維持。",
        activityDate: new Date("2026-04-15"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[1].id,
        contactId: contacts[3].id,
        dealId: deals[6].id,
        type: "meeting",
        subject: "データ分析基盤の概念提案",
        body: "松本部長へのプレゼンテーション実施。競合との差別化ポイントを強調。役員プレゼンへのエスカレーションを打診、前向きな反応。",
        activityDate: new Date("2026-05-05"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[4].id,
        contactId: contacts[8].id,
        dealId: deals[7].id,
        type: "email",
        subject: "在庫管理システム現状調査のご依頼",
        body: "石田様へ現行システムの調査に必要な情報を依頼するメールを送付。ヒアリングシートを添付。",
        activityDate: new Date("2026-05-08"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[0].id,
        type: "note",
        subject: "四半期レビューメモ",
        body: "テクノソリューション社との関係は良好。ERP案件を最優先で進める。セキュリティ診断は継続見込み。",
        activityDate: new Date("2026-05-01"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[1].id,
        contactId: contacts[2].id,
        type: "phone",
        subject: "展示会後のフォローアップ",
        body: "先日の展示会でお会いしたことをきっかけに電話。2件の案件に興味を持っていただいている。",
        activityDate: new Date("2026-04-20"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[2].id,
        contactId: contacts[4].id,
        dealId: deals[2].id,
        type: "meeting",
        subject: "デモンストレーション実施",
        body: "院長も参加する形でシステムデモを実施。操作性に高評価。価格面の調整が最後の課題。",
        activityDate: new Date("2026-04-25"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[4].id,
        contactId: contacts[7].id,
        type: "email",
        subject: "会社紹介資料の送付",
        body: "橋本部長へ会社概要と導入事例資料を送付。製造業での実績を特に強調。",
        activityDate: new Date("2026-04-10"),
      },
    }),
    prisma.activity.create({
      data: {
        companyId: companies[0].id,
        contactId: contacts[9].id,
        dealId: deals[0].id,
        type: "meeting",
        subject: "購買部との契約条件確認",
        body: "福田担当者と契約条件について打合せ。支払い条件は翌月末払いで合意。",
        activityDate: new Date("2026-05-12"),
      },
    }),
  ]);

  // Tasks
  await Promise.all([
    prisma.task.create({
      data: {
        companyId: companies[0].id,
        dealId: deals[0].id,
        title: "提案書最終版の作成",
        description: "6/10までに中村部長へ提出。費用明細と実装スケジュールを含めること。",
        dueDate: new Date("2026-06-10"),
        priority: "high",
        status: "in_progress",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[2].id,
        dealId: deals[2].id,
        title: "セキュリティ要件への対応可否回答",
        description: "ISMS要件書を技術チームで確認し、5/25までに回答する。",
        dueDate: new Date("2026-05-25"),
        priority: "high",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[1].id,
        dealId: deals[1].id,
        title: "ヒアリングMTGの事前準備",
        description: "6/20のヒアリングに向けて質問事項をまとめる。現行システムの仕様確認も必要。",
        dueDate: new Date("2026-06-18"),
        priority: "medium",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[1].id,
        dealId: deals[6].id,
        title: "役員プレゼン資料の作成",
        description: "7/15の役員プレゼン向けに資料を作成。ROI試算を含めること。",
        dueDate: new Date("2026-07-10"),
        priority: "high",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[4].id,
        dealId: deals[3].id,
        title: "IoTデモ環境の準備",
        description: "7月のデモに向けてサンプルデータを用意し、デモ環境を構築する。",
        dueDate: new Date("2026-06-30"),
        priority: "medium",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[4].id,
        dealId: deals[7].id,
        title: "現行システム調査訪問の準備",
        description: "7/5の訪問に向けてヒアリング項目を整理。現行システムのヒアリングシートを作成。",
        dueDate: new Date("2026-07-03"),
        priority: "medium",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[0].id,
        title: "四半期商談レビュー資料作成",
        description: "社内の四半期レビューに向けてテクノソリューション社の商談状況をまとめる。",
        dueDate: new Date("2026-05-20"),
        priority: "low",
        status: "in_progress",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[3].id,
        title: "来期フォロー計画の立案",
        description: "フードサービス社への来期アプローチ計画を作成。予算申請時期に合わせて接触する。",
        dueDate: new Date("2026-07-31"),
        priority: "low",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[2].id,
        dealId: deals[2].id,
        title: "契約書ドラフト作成",
        description: "交渉が進んでいるため、先行して契約書ドラフトを法務部と調整する。",
        dueDate: new Date("2026-05-30"),
        priority: "high",
        status: "todo",
      },
    }),
    prisma.task.create({
      data: {
        companyId: companies[0].id,
        dealId: deals[4].id,
        title: "セキュリティ診断サービス開始準備",
        description: "初回診断の日程調整と診断スコープの確認を行う。",
        dueDate: new Date("2026-05-15"),
        priority: "medium",
        status: "in_progress",
      },
    }),
  ]);

  // Reports
  const [dealReport, stageReport, activityReport, companyReport, taskReport, funnelReport] = await Promise.all([
    prisma.report.create({
      data: {
        name: "商談一覧",
        description: "全商談の一覧レポート",
        objectType: "deal",
        columns: ["dealName", "stage", "amount", "probability", "expectedCloseDate", "company.companyName"],
        filters: [],
        sortField: "expectedCloseDate",
        sortDir: "asc",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.report.create({
      data: {
        name: "ステージ別商談集計",
        description: "商談のステージ別集計",
        objectType: "deal",
        columns: ["stage", "amount"],
        filters: [],
        sortField: "amount",
        sortDir: "desc",
        groupBy: "stage",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.report.create({
      data: {
        name: "活動履歴一覧",
        description: "直近の活動履歴",
        objectType: "activity",
        columns: ["type", "subject", "activityDate", "company.companyName"],
        filters: [],
        sortField: "activityDate",
        sortDir: "desc",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.report.create({
      data: {
        name: "企業一覧",
        description: "顧客企業の一覧",
        objectType: "company",
        columns: ["companyName", "industry", "status"],
        filters: [],
        sortField: "companyName",
        sortDir: "asc",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.report.create({
      data: {
        name: "タスク一覧",
        description: "未完了タスクの一覧",
        objectType: "activity",
        columns: ["subject", "type", "activityDate"],
        filters: [],
        sortField: "activityDate",
        sortDir: "asc",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.report.create({
      data: {
        name: "ファネル分析",
        description: "商談のステージ別ファネル",
        objectType: "deal",
        columns: ["stage", "amount"],
        filters: [],
        sortField: null,
        sortDir: "desc",
        groupBy: "stage",
        isPublic: true,
        createdById: adminUser.id,
      },
    }),
  ]);

  // Dashboards
  const salesDashboard = await prisma.dashboard.create({
    data: {
      name: "営業ダッシュボード",
      description: "営業チームの主要KPIと商談状況",
      visibility: "PUBLIC",
      defaultDateRange: "thisMonth",
      ownerId: adminUser.id,
    },
  });
  const managerDashboard = await prisma.dashboard.create({
    data: {
      name: "マネージャーダッシュボード",
      description: "チーム全体のパフォーマンス管理",
      visibility: "TEAM",
      defaultDateRange: "thisQuarter",
      ownerId: adminUser.id,
    },
  });
  const activityDashboard = await prisma.dashboard.create({
    data: {
      name: "活動管理ダッシュボード",
      description: "活動履歴とタスクの進捗管理",
      visibility: "PUBLIC",
      defaultDateRange: "last30",
      ownerId: adminUser.id,
    },
  });

  // 営業ダッシュボード widgets
  await Promise.all([
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id,
        reportId: dealReport.id,
        title: "商談件数（今月）",
        widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL",
        sortOrder: 0,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id,
        reportId: dealReport.id,
        title: "商談金額合計（今月）",
        widgetType: "KPI",
        config: { metric: "sumAmount", format: "currency" },
        size: "SMALL",
        sortOrder: 1,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id,
        reportId: stageReport.id,
        title: "ステージ別商談金額",
        widgetType: "BAR",
        config: { orientation: "horizontal", yAxis: "amount" },
        size: "MEDIUM",
        sortOrder: 2,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id,
        reportId: dealReport.id,
        title: "商談一覧",
        widgetType: "TABLE",
        config: { limit: "10" },
        size: "WIDE",
        sortOrder: 3,
      },
    }),
  ]);

  // マネージャーダッシュボード widgets
  await Promise.all([
    prisma.dashboardWidget.create({
      data: {
        dashboardId: managerDashboard.id,
        reportId: stageReport.id,
        title: "ステージ別商談（ファネル）",
        widgetType: "FUNNEL",
        config: { metric: "amount" },
        size: "MEDIUM",
        sortOrder: 0,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: managerDashboard.id,
        reportId: stageReport.id,
        title: "ステージ別件数",
        widgetType: "PIE",
        config: {},
        size: "MEDIUM",
        sortOrder: 1,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: managerDashboard.id,
        reportId: dealReport.id,
        title: "商談一覧（今四半期）",
        widgetType: "TABLE",
        config: { limit: "20" },
        size: "WIDE",
        sortOrder: 2,
      },
    }),
  ]);

  // 活動管理ダッシュボード widgets
  await Promise.all([
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id,
        reportId: activityReport.id,
        title: "活動件数",
        widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL",
        sortOrder: 0,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id,
        reportId: activityReport.id,
        title: "活動履歴",
        widgetType: "TABLE",
        config: { limit: "15" },
        size: "WIDE",
        sortOrder: 1,
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id,
        reportId: companyReport.id,
        title: "企業一覧",
        widgetType: "TABLE",
        config: { limit: "10" },
        size: "MEDIUM",
        sortOrder: 2,
      },
    }),
  ]);

  void dealReport; void stageReport; void activityReport; void companyReport; void taskReport; void funnelReport;

  console.log("✅ シードデータの投入が完了しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
