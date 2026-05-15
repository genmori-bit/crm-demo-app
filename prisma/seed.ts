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
  // MA cleanup
  await prisma.programEnrollment.deleteMany();
  await prisma.engagementProgramNode.deleteMany();
  await prisma.engagementProgram.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.scoringRule.deleteMany();
  await prisma.gradingProfile.deleteMany();
  await prisma.emailRecipient.deleteMany();
  await prisma.marketingEmail.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.formHandler.deleteMany();
  await prisma.marketingForm.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.marketingListMembership.deleteMany();
  await prisma.marketingList.deleteMany();
  await prisma.prospectActivity.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.landingPage.deleteMany();

  // Settings seed
  await prisma.permissionSetAssignment.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.userAppAccess.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.userInvitation.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.team.deleteMany();
  await prisma.permissionSet.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.role.deleteMany();
  await prisma.securitySettings.deleteMany();
  await prisma.orgSettings.deleteMany();

  // New standard objects cleanup
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.opportunityLineItem.deleteMany();
  await prisma.priceBookEntry.deleteMany();
  await prisma.priceBook.deleteMany();
  await prisma.product.deleteMany();
  await prisma.campaignInfluence.deleteMany();
  await prisma.campaignMember.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.activityRelation.deleteMany();
  await prisma.opportunityContactRole.deleteMany();
  await prisma.case.deleteMany();
  // New Lead MA models cleanup
  await prisma.leadProgramEnrollment.deleteMany();
  await prisma.leadFormSubmission.deleteMany();
  await prisma.leadEmailRecipient.deleteMany();
  await prisma.leadListMembership.deleteMany();
  await prisma.leadEngagementActivity.deleteMany();
  await prisma.lead.deleteMany();
  // ObjectDefinition cleanup (keep for upsert)
  await prisma.fieldDefinition.deleteMany();
  await prisma.customObjectRecord.deleteMany();
  await prisma.objectDefinition.deleteMany();

  // Profiles
  const [adminProfile, managerProfile, salesProfile] = await Promise.all([
    prisma.profile.create({
      data: {
        name: "システム管理者",
        description: "すべての権限を持つシステム管理者プロファイル",
        isSystem: true,
        permissions: Object.fromEntries([
          "company.view","company.create","company.edit","company.delete","company.export",
          "contact.view","contact.create","contact.edit","contact.delete",
          "deal.view","deal.create","deal.edit","deal.delete","deal.export",
          "activity.view","activity.create","activity.edit","activity.delete",
          "task.view","task.create","task.edit","task.delete",
          "report.view","report.create","report.edit","report.delete",
          "dashboard.view","dashboard.create","dashboard.edit","dashboard.delete",
          "ma.view","ma.prospect.view","ma.prospect.edit","ma.email.view","ma.email.send",
          "ma.form.view","ma.form.edit","ma.program.view","ma.program.edit",
          "setup.view","setup.user.view","setup.user.create","setup.user.edit","setup.user.disable",
          "setup.role.manage","setup.profile.manage","setup.permissionset.manage",
          "setup.team.manage","setup.appaccess.manage","setup.security.manage","setup.audit.view","setup.org.manage",
          "data.import","data.export","data.tags.manage",
        ].map((k) => [k, true])),
      },
    }),
    prisma.profile.create({
      data: {
        name: "マネージャー",
        description: "チームマネージャー向けプロファイル",
        permissions: Object.fromEntries([
          "company.view","company.create","company.edit","company.export",
          "contact.view","contact.create","contact.edit",
          "deal.view","deal.create","deal.edit","deal.export",
          "activity.view","activity.create","activity.edit",
          "task.view","task.create","task.edit",
          "report.view","report.create","report.edit",
          "dashboard.view","dashboard.create","dashboard.edit",
          "ma.view","ma.prospect.view","ma.prospect.edit","ma.email.view",
          "ma.form.view","ma.program.view",
          "setup.view","setup.user.view","setup.team.manage","setup.audit.view",
          "data.import","data.export","data.tags.manage",
        ].map((k) => [k, true])),
      },
    }),
    prisma.profile.create({
      data: {
        name: "営業担当",
        description: "標準的な営業担当者プロファイル",
        permissions: Object.fromEntries([
          "company.view","company.create","company.edit",
          "contact.view","contact.create","contact.edit",
          "deal.view","deal.create","deal.edit",
          "activity.view","activity.create","activity.edit",
          "task.view","task.create","task.edit",
          "report.view","dashboard.view",
          "ma.view","ma.prospect.view",
        ].map((k) => [k, true])),
      },
    }),
  ]);

  // Roles
  const [ceoRole, salesDirRole, salesMgrRole] = await Promise.all([
    prisma.role.create({ data: { name: "CEO", description: "最高経営責任者", sortOrder: 1 } }),
    prisma.role.create({ data: { name: "営業本部長", description: "営業部門トップ", sortOrder: 2 } }),
    prisma.role.create({ data: { name: "営業マネージャー", description: "営業チームリーダー", sortOrder: 3 } }),
  ]);
  await prisma.role.update({ where: { id: salesDirRole.id }, data: { parentId: ceoRole.id } });
  await prisma.role.update({ where: { id: salesMgrRole.id }, data: { parentId: salesDirRole.id } });

  // Permission sets
  const [maWritePS] = await Promise.all([
    prisma.permissionSet.create({
      data: {
        name: "ma_write",
        label: "MAフル編集",
        description: "マーケティングオートメーションの全編集権限",
        permissions: Object.fromEntries([
          "ma.view","ma.prospect.view","ma.prospect.edit","ma.email.view","ma.email.send",
          "ma.form.view","ma.form.edit","ma.program.view","ma.program.edit",
        ].map((k) => [k, true])),
      },
    }),
    prisma.permissionSet.create({
      data: {
        name: "data_admin",
        label: "データ管理者",
        description: "インポート・エクスポート・タグ管理権限",
        permissions: Object.fromEntries(["data.import","data.export","data.tags.manage"].map((k) => [k, true])),
      },
    }),
  ]);

  // Org & security defaults
  await prisma.orgSettings.create({ data: { id: "singleton", orgName: "デモ株式会社" } });
  await prisma.securitySettings.create({ data: { id: "singleton" } });

  // Users
  const hashedPassword = await bcrypt.hash("password123", 12);
  const [adminUser] = await Promise.all([
    prisma.user.create({
      data: { email: "admin@example.com", name: "管理者", passwordHash: hashedPassword, role: "ADMIN", profileId: adminProfile.id, department: "システム管理", title: "システム管理者" },
    }),
    prisma.user.create({
      data: { email: "manager@example.com", name: "田中マネージャー", passwordHash: hashedPassword, role: "MANAGER", profileId: managerProfile.id, department: "営業部", title: "営業マネージャー" },
    }),
    prisma.user.create({
      data: { email: "sales1@example.com", name: "山田 営業一郎", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業1課", title: "営業担当" },
    }),
    prisma.user.create({
      data: { email: "sales2@example.com", name: "佐藤 営業花子", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業2課", title: "シニア営業担当" },
    }),
    prisma.user.create({
      data: { email: "sales3@example.com", name: "鈴木 営業次郎", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業1課", title: "営業担当" },
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

  // =================== MA Seed Data ===================

  // Prospects
  const prospectData = [
    { email: "tanaka.kenji@techcorp.co.jp", firstName: "健二", lastName: "田中", companyName: "テクノロジー株式会社", jobTitle: "CTO", score: 85, grade: "A", source: "web" },
    { email: "yamada.haruki@startup.io", firstName: "春樹", lastName: "山田", companyName: "スタートアップ合同会社", jobTitle: "CEO", score: 120, grade: "A+", source: "web" },
    { email: "suzuki.yuki@enterprise.jp", firstName: "由紀", lastName: "鈴木", companyName: "エンタープライズ商事", jobTitle: "購買部長", score: 45, grade: "B", source: "import" },
    { email: "ito.masato@manufacturing.co.jp", firstName: "雅人", lastName: "伊藤", companyName: "製造業株式会社", jobTitle: "IT部長", score: 30, grade: "C", source: "manual" },
    { email: "watanabe.akiko@consulting.jp", firstName: "明子", lastName: "渡辺", companyName: "コンサルティング会社", jobTitle: "マネージャー", score: 65, grade: "B", source: "web" },
    { email: "kobayashi.ryo@fintech.co.jp", firstName: "涼", lastName: "小林", companyName: "フィンテック株式会社", jobTitle: "CFO", score: 95, grade: "A", source: "web" },
    { email: "nakamura.sota@ecommerce.jp", firstName: "蒼太", lastName: "中村", companyName: "Eコマース会社", jobTitle: "マーケティング部長", score: 55, grade: "B", source: "import" },
    { email: "kato.misa@retail.co.jp", firstName: "美沙", lastName: "加藤", companyName: "リテール株式会社", jobTitle: "店長", score: 20, grade: "D", source: "web" },
    { email: "yoshida.takumi@saas.io", firstName: "匠", lastName: "吉田", companyName: "SaaS企業", jobTitle: "VP Sales", score: 150, grade: "A+", source: "web" },
    { email: "hayashi.nana@healthcare.jp", firstName: "奈々", lastName: "林", companyName: "ヘルスケア株式会社", jobTitle: "人事部長", score: 10, grade: "D", source: "manual" },
    { email: "kimura.taro@logistics.co.jp", firstName: "太郎", lastName: "木村", companyName: "物流株式会社", jobTitle: "部長", score: 40, grade: "C", source: "web" },
    { email: "shimizu.hanako@education.jp", firstName: "花子", lastName: "清水", companyName: "教育機関", jobTitle: "理事長", score: 75, grade: "B", source: "import" },
    { email: "inoue.ken@media.co.jp", firstName: "健", lastName: "井上", companyName: "メディア会社", jobTitle: "編集長", score: 60, grade: "B", source: "web" },
    { email: "sasaki.yumi@tourism.jp", firstName: "由美", lastName: "佐々木", companyName: "観光業", jobTitle: "代表取締役", score: 35, grade: "C", source: "web" },
    { email: "yamaguchi.daisuke@auto.co.jp", firstName: "大輔", lastName: "山口", companyName: "自動車メーカー", jobTitle: "調達担当", score: 80, grade: "A", source: "import" },
  ];

  const prospects = await Promise.all(
    prospectData.map((p) => prisma.prospect.create({ data: { ...p, status: "active", lastActivityAt: new Date() } }))
  );

  // Marketing Lists
  const [listAll, listHot, listNew] = await Promise.all([
    prisma.marketingList.create({ data: { name: "全プロスペクト", description: "全ての有効なプロスペクト", type: "static", createdById: adminUser.id } }),
    prisma.marketingList.create({ data: { name: "ホットリード", description: "スコア70以上", type: "static", createdById: adminUser.id } }),
    prisma.marketingList.create({ data: { name: "新規リード（Web流入）", description: "Web経由の新規リード", type: "static", createdById: adminUser.id } }),
  ]);

  // Add members to lists
  await Promise.all([
    ...prospects.map((p) => prisma.marketingListMembership.create({ data: { listId: listAll.id, prospectId: p.id, addedBy: "import" } })),
    ...prospects.filter((p) => p.score >= 70).map((p) => prisma.marketingListMembership.create({ data: { listId: listHot.id, prospectId: p.id, addedBy: "automation" } })),
    ...prospects.filter((p) => p.source === "web").map((p) => prisma.marketingListMembership.create({ data: { listId: listNew.id, prospectId: p.id, addedBy: "automation" } })),
  ]);

  // Email Template
  const template = await prisma.emailTemplate.create({
    data: {
      name: "製品紹介テンプレート",
      subject: "【{{company}}様へ】弊社ソリューションのご紹介",
      previewText: "貴社の課題解決をサポートします",
      fromName: "営業チーム",
      fromEmail: "sales@example.com",
      bodyHtml: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<h2 style="color:#0176d3;">{{first_name}}様</h2>
<p>平素よりお世話になっております。</p>
<p>この度は弊社サービスにご興味をお持ちいただきありがとうございます。</p>
<p>{{company}}様の課題解決に向けて、弊社ソリューションをご提案させていただきたいと存じます。</p>
<p style="margin-top:20px;"><a href="#" style="background:#0176d3;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;">詳細を見る</a></p>
<p style="margin-top:30px;font-size:12px;color:#999;">配信停止をご希望の方は<a href="{{unsubscribe_url}}">こちら</a></p>
</body></html>`,
      type: "regular",
      createdById: adminUser.id,
    },
  });

  // Marketing Emails
  const email1 = await prisma.marketingEmail.create({
    data: {
      name: "2024年 春のキャンペーン",
      subject: "春の特別オファーをお届けします",
      fromName: "マーケティングチーム",
      fromEmail: "marketing@example.com",
      templateId: template.id,
      listId: listAll.id,
      bodyHtml: template.bodyHtml,
      status: "sent",
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      totalSent: 15,
      totalOpened: 8,
      totalClicked: 3,
      createdById: adminUser.id,
    },
  });

  const email2 = await prisma.marketingEmail.create({
    data: {
      name: "ホットリード向けフォローアップ",
      subject: "【重要】ご提案資料をお送りします",
      fromName: "営業チーム",
      fromEmail: "sales@example.com",
      listId: listHot.id,
      bodyHtml: "<p>先日はお問い合わせありがとうございました。</p>",
      status: "draft",
      createdById: adminUser.id,
    },
  });

  void email1; void email2;

  // Prospect Activities
  await Promise.all(
    prospects.slice(0, 5).map((p) =>
      prisma.prospectActivity.create({
        data: { prospectId: p.id, type: "email_send", description: "春のキャンペーンメール送信", score: 0, metadata: { emailId: email1.id } },
      })
    )
  );
  await Promise.all(
    prospects.slice(0, 3).map((p) =>
      prisma.prospectActivity.create({
        data: { prospectId: p.id, type: "email_open", description: "春のキャンペーンメール開封", score: 5 },
      })
    )
  );

  // Marketing Form
  const form = await prisma.marketingForm.create({
    data: {
      name: "資料請求フォーム",
      description: "製品資料の請求に利用するフォームです",
      fields: [
        { id: "f1", type: "email", label: "メールアドレス", name: "email", required: true },
        { id: "f2", type: "text", label: "名前", name: "name", required: true },
        { id: "f3", type: "text", label: "会社名", name: "company", required: false },
        { id: "f4", type: "text", label: "電話番号", name: "phone", required: false },
      ] as object[],
      thankYouMsg: "資料請求を受け付けました。2営業日以内にご連絡いたします。",
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // Landing Page
  await prisma.landingPage.create({
    data: {
      name: "製品紹介LP",
      title: "業務効率を劇的に改善するCRMソリューション",
      slug: "product-overview",
      description: "製品の主要機能と導入メリットを紹介するページ",
      bodyHtml: `<div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:sans-serif;">
<h1 style="color:#0176d3;font-size:2.5em;">業務効率を劇的に改善するCRM</h1>
<p style="font-size:1.2em;color:#444;margin:20px 0;">営業チームの生産性を最大化し、顧客満足度を向上させます。</p>
<div style="background:#f0f4ff;padding:30px;border-radius:8px;margin:30px 0;">
<h2>主な機能</h2>
<ul>
<li>顧客・商談管理</li>
<li>マーケティングオートメーション</li>
<li>レポート・ダッシュボード</li>
</ul>
</div>
</div>`,
      status: "published",
      publishedAt: new Date(),
      views: 342,
      createdById: adminUser.id,
    },
  });

  // Scoring Rules
  await Promise.all([
    prisma.scoringRule.create({ data: { name: "メール開封", category: "behavior", triggerType: "email_open", scoreChange: 5, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "メールクリック", category: "behavior", triggerType: "email_click", scoreChange: 10, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "フォーム送信", category: "behavior", triggerType: "form_submit", scoreChange: 25, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "価格ページ閲覧", category: "behavior", triggerType: "page_view_pricing", scoreChange: 15, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "製品ページ閲覧", category: "behavior", triggerType: "page_view_product", scoreChange: 5, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "メールバウンス", category: "behavior", triggerType: "email_bounce", scoreChange: -10, isActive: true } }),
  ]);

  // Automation Rules
  await Promise.all([
    prisma.automationRule.create({
      data: {
        name: "フォーム送信時 ホットリストに追加",
        description: "資料請求フォームが送信された場合、ホットリードリストに追加",
        triggerType: "form_submit",
        triggerConf: { formId: form.id } as object,
        conditions: [] as object[],
        actions: [{ type: "add_to_list", config: { listId: listHot.id } }] as object[],
        isActive: true,
        createdById: adminUser.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "スコア100以上で担当者通知",
        description: "プロスペクトのスコアが100を超えたら担当者に通知",
        triggerType: "score_change",
        triggerConf: { threshold: 100 } as object,
        conditions: [{ field: "score", operator: "gte", value: 100 }] as object[],
        actions: [{ type: "notify_user", config: { message: "ホットリードが発生しました" } }] as object[],
        isActive: true,
        createdById: adminUser.id,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "新規プロスペクト全体リスト追加",
        description: "プロスペクト作成時に全体リストへ自動追加",
        triggerType: "prospect_created",
        triggerConf: {} as object,
        conditions: [] as object[],
        actions: [{ type: "add_to_list", config: { listId: listAll.id } }] as object[],
        isActive: true,
        createdById: adminUser.id,
      },
    }),
  ]);

  // ===================== New Standard Objects Seed =====================

  // Leads (120 records)
  const leadStatuses = ["NEW", "WORKING", "NURTURING", "CONVERTED", "DISQUALIFIED"];
  const leadRatings = ["HOT", "WARM", "COLD"];
  const leadSources = ["Web", "Email", "Phone", "Event", "Partner", "Referral", "SNS"];
  const industries = ["IT", "製造", "金融", "小売", "医療", "教育", "不動産", "物流", "サービス", "建設"];
  const firstNames = ["太郎", "花子", "一郎", "愛", "健太", "さくら", "翔", "美咲", "大輔", "由美"];
  const lastNames = ["田中", "鈴木", "佐藤", "高橋", "山本", "伊藤", "渡辺", "加藤", "吉田", "山田", "中村", "小林"];

  const seedLeads = [];
  for (let i = 0; i < 120; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const status = leadStatuses[i % leadStatuses.length];
    seedLeads.push(
      prisma.lead.create({
        data: {
          firstName: fn,
          lastName: ln,
          fullName: `${ln} ${fn}`,
          email: `lead${i + 1}@example${(i % 10) + 1}.com`,
          phone: `03-${String(i + 1000).padStart(4, "0")}-${String(i * 7 % 9999).padStart(4, "0")}`,
          companyName: `株式会社サンプル${i + 1}`,
          title: ["部長", "課長", "主任", "担当", "マネージャー", "ディレクター"][i % 6],
          industry: industries[i % industries.length],
          source: leadSources[i % leadSources.length],
          status,
          rating: leadRatings[i % leadRatings.length],
          score: Math.floor(Math.random() * 100),
          ownerId: adminUser.id,
        },
      })
    );
  }
  await Promise.all(seedLeads);

  // Campaigns (20 records)
  const campaignTypes = ["Email", "Event", "Webinar", "Content", "SNS", "Paid"];
  const campaignStatuses = ["Planning", "Active", "Completed", "Aborted"];
  const seedCampaigns = [];
  for (let i = 0; i < 20; i++) {
    const startDate = new Date(2026, (i % 12), 1);
    const endDate = new Date(2026, (i % 12), 28);
    seedCampaigns.push(
      prisma.campaign.create({
        data: {
          name: `${["春の大商談フェア", "製品ローンチキャンペーン", "ウェビナーシリーズ", "パートナー紹介プログラム", "SNSキャンペーン"][i % 5]} ${2026 - Math.floor(i / 5)}Q${(i % 4) + 1}`,
          type: campaignTypes[i % campaignTypes.length],
          status: campaignStatuses[i % campaignStatuses.length],
          description: `${campaignTypes[i % campaignTypes.length]}を活用した見込み客獲得施策`,
          startDate,
          endDate,
          budget: (i + 1) * 500000,
          actualCost: i < 10 ? (i + 1) * 350000 : null,
          isActive: i % campaignStatuses.length === 1,
          ownerId: adminUser.id,
        },
      })
    );
  }
  await Promise.all(seedCampaigns);

  // Products (30 records) + Standard PriceBook
  const productFamilies = ["クラウド", "オンプレ", "サービス", "ライセンス", "サポート"];
  const createdProducts = [];
  for (let i = 0; i < 30; i++) {
    createdProducts.push(
      await prisma.product.create({
        data: {
          name: `${["CRMプラン", "MAプラン", "分析プラン", "エンタープライズ", "スタータープラン"][i % 5]} ${["ベーシック", "スタンダード", "プレミアム", "エンタープライズ", "カスタム"][Math.floor(i / 5) % 5]}`,
          productCode: `PROD-${String(i + 1).padStart(4, "0")}`,
          family: productFamilies[i % productFamilies.length],
          description: `${productFamilies[i % productFamilies.length]}向け製品・サービス`,
          isActive: i < 25,
        },
      })
    );
  }

  const standardPB = await prisma.priceBook.create({
    data: { name: "標準価格表", isStandard: true, isActive: true },
  });
  const premiumPB = await prisma.priceBook.create({
    data: { name: "プレミアム価格表", isStandard: false, isActive: true },
  });

  for (let i = 0; i < createdProducts.length; i++) {
    await prisma.priceBookEntry.create({
      data: {
        priceBookId: standardPB.id,
        productId: createdProducts[i].id,
        unitPrice: (i + 1) * 50000,
        isActive: i < 25,
      },
    });
    if (i < 15) {
      await prisma.priceBookEntry.create({
        data: {
          priceBookId: premiumPB.id,
          productId: createdProducts[i].id,
          unitPrice: (i + 1) * 70000,
          isActive: true,
        },
      });
    }
  }

  // Cases (80 records) — link to existing companies
  const caseSubjects = [
    "ログインできない", "データが同期しない", "レポートが表示されない",
    "インポートエラーが発生する", "メール送信が失敗する", "APIが応答しない",
    "パフォーマンスが遅い", "設定変更が反映されない",
  ];
  const caseStatuses = ["New", "Open", "Pending Customer", "Closed"];
  const casePriorities = ["Critical", "High", "Medium", "Low"];
  const caseTypes = ["Question", "Bug", "Feature Request", "Other"];

  const caseCompanies = await prisma.company.findMany({ take: 20 });
  for (let i = 0; i < 80; i++) {
    const company = caseCompanies[i % caseCompanies.length];
    await prisma.case.create({
      data: {
        subject: `${caseSubjects[i % caseSubjects.length]} (${i + 1})`,
        description: "詳細な説明文がここに入ります。再現手順を記載してください。",
        status: caseStatuses[i % caseStatuses.length],
        priority: casePriorities[i % casePriorities.length],
        type: caseTypes[i % caseTypes.length],
        origin: ["Email", "Phone", "Web", "Chat"][i % 4],
        companyId: company.id,
        ownerId: adminUser.id,
        resolvedAt: i % 4 === 3 ? new Date() : null,
        resolution: i % 4 === 3 ? "設定を修正して解決しました。" : null,
      },
    });
  }

  // Grading Profile
  await prisma.gradingProfile.create({
    data: {
      name: "標準グレーディング",
      description: "業種・役職・会社規模に基づくグレード判定",
      criteria: [
        { field: "jobTitle", contains: "CEO", gradeBoost: 2 },
        { field: "jobTitle", contains: "部長", gradeBoost: 1 },
        { field: "industry", value: "IT", gradeBoost: 1 },
      ] as object[],
      isDefault: true,
    },
  });

  // Engagement Program
  const program = await prisma.engagementProgram.create({
    data: {
      name: "新規リードナーチャリング",
      description: "新規リード向けの3ステップナーチャリングプログラム",
      status: "active",
      createdById: adminUser.id,
    },
  });
  await Promise.all([
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "email", label: "ウェルカムメール送信", config: { delay: 0 } as object, positionX: 100, positionY: 50 } }),
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "wait", label: "3日待機", config: { days: 3 } as object, positionX: 100, positionY: 150 } }),
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "email", label: "製品紹介メール送信", config: { delay: 3 } as object, positionX: 100, positionY: 250 } }),
  ]);

  // ===================== Standard ObjectDefinitions =====================
  console.log("📦 標準オブジェクト定義を登録中...");

  const standardObjects = [
    { apiName: "Lead", label: "リード", pluralLabel: "リード", category: "CRM", description: "CRM/MA共通のリードオブジェクト", enableActivities: true, enableNotes: true, enableFiles: false, enableHistory: true },
    { apiName: "Account", label: "顧客企業", pluralLabel: "顧客企業", category: "CRM", description: "顧客・取引先企業を管理します", enableActivities: true, enableNotes: true, enableFiles: true, enableHistory: true },
    { apiName: "Contact", label: "担当者", pluralLabel: "担当者", category: "CRM", description: "取引先担当者を管理します", enableActivities: true, enableNotes: true, enableFiles: false, enableHistory: true },
    { apiName: "Deal", label: "商談", pluralLabel: "商談", category: "CRM", description: "営業商談・案件を管理します", enableActivities: true, enableNotes: true, enableFiles: true, enableHistory: true },
    { apiName: "Campaign", label: "キャンペーン", pluralLabel: "キャンペーン", category: "CRM", description: "マーケティングキャンペーンを管理します", enableActivities: false, enableNotes: true, enableFiles: false, enableHistory: true },
    { apiName: "Case", label: "ケース", pluralLabel: "ケース", category: "CRM", description: "サポートケース・問い合わせを管理します", enableActivities: true, enableNotes: true, enableFiles: true, enableHistory: true },
    { apiName: "Product", label: "商品", pluralLabel: "商品", category: "CRM", description: "製品・サービスのカタログを管理します", enableActivities: false, enableNotes: true, enableFiles: false, enableHistory: true },
    { apiName: "Task", label: "タスク", pluralLabel: "タスク", category: "CRM", description: "ToDo・タスクを管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: false },
    { apiName: "Activity", label: "活動", pluralLabel: "活動", category: "CRM", description: "コール・メール・訪問などの活動ログ", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: false },
    { apiName: "Quote", label: "見積", pluralLabel: "見積", category: "CRM", description: "商談に紐づく見積を管理します", enableActivities: false, enableNotes: true, enableFiles: true, enableHistory: true },
    { apiName: "Contract", label: "契約", pluralLabel: "契約", category: "CRM", description: "顧客との契約を管理します", enableActivities: false, enableNotes: true, enableFiles: true, enableHistory: true },
    { apiName: "Order", label: "注文", pluralLabel: "注文", category: "CRM", description: "受注・注文を管理します", enableActivities: false, enableNotes: true, enableFiles: false, enableHistory: true },
    { apiName: "PriceBook", label: "価格表", pluralLabel: "価格表", category: "CRM", description: "商品の価格表を管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: false },
    { apiName: "MarketingEmail", label: "マーケティングメール", pluralLabel: "マーケティングメール", category: "MA", description: "MAメール配信を管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: true },
    { apiName: "MarketingForm", label: "フォーム", pluralLabel: "フォーム", category: "MA", description: "問い合わせ・資料請求フォームを管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: true },
    { apiName: "LandingPage", label: "ランディングページ", pluralLabel: "ランディングページ", category: "MA", description: "MAランディングページを管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: false },
    { apiName: "EngagementProgram", label: "Engagement Program", pluralLabel: "Engagement Programs", category: "MA", description: "ナーチャリングプログラムを管理します", enableActivities: false, enableNotes: false, enableFiles: false, enableHistory: true },
  ];

  for (const obj of standardObjects) {
    await prisma.objectDefinition.upsert({
      where: { apiName: obj.apiName },
      update: {
        label: obj.label,
        pluralLabel: obj.pluralLabel,
        category: obj.category,
        description: obj.description,
        objectType: "STANDARD",
        isActive: true,
        isSearchable: true,
        isReportable: true,
        isAuditable: true,
        enableActivities: obj.enableActivities,
        enableNotes: obj.enableNotes,
        enableFiles: obj.enableFiles,
        enableHistory: obj.enableHistory,
      },
      create: {
        apiName: obj.apiName,
        label: obj.label,
        pluralLabel: obj.pluralLabel,
        category: obj.category,
        description: obj.description,
        objectType: "STANDARD",
        isActive: true,
        isSearchable: true,
        isReportable: true,
        isAuditable: true,
        enableActivities: obj.enableActivities,
        enableNotes: obj.enableNotes,
        enableFiles: obj.enableFiles,
        enableHistory: obj.enableHistory,
        createdById: adminUser.id,
      },
    });
  }

  // Lead FieldDefinitions
  const leadObjDef = await prisma.objectDefinition.findUnique({ where: { apiName: "Lead" } });
  if (leadObjDef) {
    const leadFields = [
      { apiName: "fullName", label: "氏名", fieldType: "TEXT", isRequired: true, sortOrder: 1 },
      { apiName: "email", label: "メール", fieldType: "EMAIL", isRequired: false, sortOrder: 2 },
      { apiName: "companyName", label: "会社名", fieldType: "TEXT", isRequired: false, sortOrder: 3 },
      { apiName: "title", label: "役職", fieldType: "TEXT", isRequired: false, sortOrder: 4 },
      { apiName: "phone", label: "電話番号", fieldType: "PHONE", isRequired: false, sortOrder: 5 },
      { apiName: "status", label: "ステータス", fieldType: "PICKLIST", isRequired: true, sortOrder: 6, options: { values: ["NEW", "WORKING", "NURTURING", "MQL", "SQL", "QUALIFIED", "CONVERTED", "UNSUBSCRIBED"] } },
      { apiName: "lifecycleStage", label: "ライフサイクルステージ", fieldType: "PICKLIST", isRequired: false, sortOrder: 7, options: { values: ["VISITOR", "LEAD", "MQL", "SQL", "OPPORTUNITY", "CUSTOMER"] } },
      { apiName: "rating", label: "評価", fieldType: "PICKLIST", isRequired: false, sortOrder: 8, options: { values: ["HOT", "WARM", "COLD"] } },
      { apiName: "score", label: "スコア", fieldType: "NUMBER", isRequired: false, sortOrder: 9 },
      { apiName: "grade", label: "グレード", fieldType: "TEXT", isRequired: false, sortOrder: 10 },
      { apiName: "consentStatus", label: "同意状態", fieldType: "PICKLIST", isRequired: false, sortOrder: 11, options: { values: ["UNKNOWN", "OPTED_IN", "OPTED_OUT"] } },
      { apiName: "doNotEmail", label: "メール配信停止", fieldType: "BOOLEAN", isRequired: false, sortOrder: 12 },
      { apiName: "optedOut", label: "オプトアウト", fieldType: "BOOLEAN", isRequired: false, sortOrder: 13 },
      { apiName: "emailBounced", label: "メールバウンス", fieldType: "BOOLEAN", isRequired: false, sortOrder: 14 },
      { apiName: "source", label: "参照元", fieldType: "TEXT", isRequired: false, sortOrder: 15 },
      { apiName: "industry", label: "業種", fieldType: "TEXT", isRequired: false, sortOrder: 16 },
      { apiName: "website", label: "ウェブサイト", fieldType: "URL", isRequired: false, sortOrder: 17 },
      { apiName: "assignedUserId", label: "担当者", fieldType: "LOOKUP", isRequired: false, sortOrder: 18 },
      { apiName: "ownerId", label: "所有者", fieldType: "LOOKUP", isRequired: false, sortOrder: 19 },
      { apiName: "crmContactId", label: "CRM担当者", fieldType: "LOOKUP", isRequired: false, sortOrder: 20 },
      { apiName: "convertedAt", label: "変換日時", fieldType: "DATETIME", isRequired: false, sortOrder: 21 },
      { apiName: "lastActivityAt", label: "最終活動日時", fieldType: "DATETIME", isRequired: false, sortOrder: 22 },
    ];

    for (const field of leadFields) {
      await prisma.fieldDefinition.upsert({
        where: { objectDefinitionId_apiName: { objectDefinitionId: leadObjDef.id, apiName: field.apiName } },
        update: { label: field.label, fieldType: field.fieldType, isRequired: field.isRequired, isSystem: true, sortOrder: field.sortOrder, options: (field as any).options ?? undefined },
        create: {
          objectDefinitionId: leadObjDef.id,
          apiName: field.apiName,
          label: field.label,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isSystem: true,
          sortOrder: field.sortOrder,
          options: (field as any).options ?? undefined,
        },
      });
    }
  }

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
