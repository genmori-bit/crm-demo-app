import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ===================== Helpers =====================
function daysAgo(n: number): Date {
  const d = new Date("2026-05-16");
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date("2026-05-16");
  d.setDate(d.getDate() + n);
  return d;
}
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  console.log("🌱 シードデータの投入を開始...");

  // ===================== Cleanup (leaf → root order) =====================
  await prisma.auditLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.dashboardWidget.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.report.deleteMany();
  await prisma.savedView.deleteMany();

  // Account 360 cleanup
  await prisma.pageComponentInstance.deleteMany();
  await prisma.recordPageAssignment.deleteMany();
  await prisma.recordPageVersion.deleteMany();
  await prisma.recordPageDefinition.deleteMany();
  await prisma.accountInsight.deleteMany();
  await prisma.accountHealthSnapshot.deleteMany();
  await prisma.accountPlan.deleteMany();
  await prisma.accountRelationship.deleteMany();
  await prisma.accountStakeholder.deleteMany();
  await prisma.accountTeamMember.deleteMany();

  // Standard objects cleanup (before company/deal/contact)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
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

  // Lead MA cleanup
  await prisma.leadProgramEnrollment.deleteMany();
  await prisma.leadFormSubmission.deleteMany();
  await prisma.leadEmailRecipient.deleteMany();
  await prisma.leadListMembership.deleteMany();
  await prisma.leadEngagementActivity.deleteMany();
  await prisma.lead.deleteMany();

  // CRM core cleanup
  await prisma.dealTag.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.dataTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunityTeamMember.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();

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

  // ObjectDefinition cleanup
  await prisma.fieldDefinition.deleteMany();
  await prisma.customObjectRecord.deleteMany();
  await prisma.objectDefinition.deleteMany();

  // User cleanup (must be after all fk dependents)
  await prisma.user.deleteMany();

  // Settings cleanup
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

  console.log("✅ 既存データを削除完了");

  // ===================== Profiles =====================
  const [adminProfile, managerProfile, salesProfile, csmProfile, marketingProfile] = await Promise.all([
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
    prisma.profile.create({
      data: {
        name: "CSM担当",
        description: "カスタマーサクセス担当者プロファイル",
        permissions: Object.fromEntries([
          "company.view","company.edit",
          "contact.view","contact.create","contact.edit",
          "deal.view",
          "activity.view","activity.create","activity.edit",
          "task.view","task.create","task.edit",
          "report.view","dashboard.view",
        ].map((k) => [k, true])),
      },
    }),
    prisma.profile.create({
      data: {
        name: "マーケティング担当",
        description: "マーケティング担当者プロファイル",
        permissions: Object.fromEntries([
          "company.view","contact.view",
          "deal.view",
          "activity.view","activity.create",
          "task.view","task.create",
          "report.view","dashboard.view",
          "ma.view","ma.prospect.view","ma.prospect.edit","ma.email.view","ma.email.send",
          "ma.form.view","ma.form.edit","ma.program.view","ma.program.edit",
        ].map((k) => [k, true])),
      },
    }),
  ]);

  // ===================== Roles =====================
  const [ceoRole, salesDirRole, salesMgrRole] = await Promise.all([
    prisma.role.create({ data: { name: "CEO", description: "最高経営責任者", sortOrder: 1 } }),
    prisma.role.create({ data: { name: "営業本部長", description: "営業部門トップ", sortOrder: 2 } }),
    prisma.role.create({ data: { name: "営業マネージャー", description: "営業チームリーダー", sortOrder: 3 } }),
  ]);
  await prisma.role.update({ where: { id: salesDirRole.id }, data: { parentId: ceoRole.id } });
  await prisma.role.update({ where: { id: salesMgrRole.id }, data: { parentId: salesDirRole.id } });
  void ceoRole; void salesDirRole; void salesMgrRole;

  // ===================== Permission Sets =====================
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
  void maWritePS;

  // ===================== Org & Security =====================
  await prisma.orgSettings.create({ data: { id: "singleton", orgName: "株式会社デモジャパン" } });
  await prisma.securitySettings.create({ data: { id: "singleton" } });

  // ===================== Users (17) =====================
  console.log("👤 ユーザーを作成中...");
  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.create({
    data: { email: "admin@example.com", name: "管理者", passwordHash: hashedPassword, role: "ADMIN", profileId: adminProfile.id, department: "システム管理", title: "システム管理者", phone: "03-0000-0001" },
  });

  const director = await prisma.user.create({
    data: { email: "director@example.com", name: "橋本 大輔", passwordHash: hashedPassword, role: "MANAGER", profileId: managerProfile.id, department: "営業部", title: "営業部長", phone: "03-0000-0002" },
  });

  const [manager1, manager2] = await Promise.all([
    prisma.user.create({
      data: { email: "manager1@example.com", name: "田中 健一", passwordHash: hashedPassword, role: "MANAGER", profileId: managerProfile.id, department: "営業1課", title: "営業マネージャー", phone: "03-0000-0003", managerId: director.id },
    }),
    prisma.user.create({
      data: { email: "manager2@example.com", name: "鈴木 裕子", passwordHash: hashedPassword, role: "MANAGER", profileId: managerProfile.id, department: "営業2課", title: "営業マネージャー", phone: "03-0000-0004", managerId: director.id },
    }),
  ]);

  const [sales1, sales2, sales3, sales4, sales5, sales6] = await Promise.all([
    prisma.user.create({ data: { email: "sales1@example.com", name: "山田 一郎", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業1課", title: "上級営業担当", phone: "03-0000-0011", managerId: manager1.id } }),
    prisma.user.create({ data: { email: "sales2@example.com", name: "佐藤 花子", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業1課", title: "営業担当", phone: "03-0000-0012", managerId: manager1.id } }),
    prisma.user.create({ data: { email: "sales3@example.com", name: "鈴木 次郎", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業1課", title: "営業担当", phone: "03-0000-0013", managerId: manager1.id } }),
    prisma.user.create({ data: { email: "sales4@example.com", name: "高橋 美咲", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業2課", title: "上級営業担当", phone: "03-0000-0014", managerId: manager2.id } }),
    prisma.user.create({ data: { email: "sales5@example.com", name: "伊藤 健太", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業2課", title: "営業担当", phone: "03-0000-0015", managerId: manager2.id } }),
    prisma.user.create({ data: { email: "sales6@example.com", name: "渡辺 さくら", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "営業2課", title: "営業担当", phone: "03-0000-0016", managerId: manager2.id } }),
  ]);

  const [se1, se2] = await Promise.all([
    prisma.user.create({ data: { email: "se1@example.com", name: "中村 拓也", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "SEチーム", title: "シニアSE", phone: "03-0000-0021" } }),
    prisma.user.create({ data: { email: "se2@example.com", name: "小林 恵子", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "SEチーム", title: "SE", phone: "03-0000-0022" } }),
  ]);

  const [csm1, csm2] = await Promise.all([
    prisma.user.create({ data: { email: "csm1@example.com", name: "加藤 誠一", passwordHash: hashedPassword, role: "SALES", profileId: csmProfile.id, department: "CSMチーム", title: "シニアCSM", phone: "03-0000-0031" } }),
    prisma.user.create({ data: { email: "csm2@example.com", name: "吉田 理恵", passwordHash: hashedPassword, role: "SALES", profileId: csmProfile.id, department: "CSMチーム", title: "CSM", phone: "03-0000-0032" } }),
  ]);

  const [marketing1, marketing2] = await Promise.all([
    prisma.user.create({ data: { email: "marketing1@example.com", name: "松本 剛", passwordHash: hashedPassword, role: "SALES", profileId: marketingProfile.id, department: "マーケティング", title: "マーケティングマネージャー", phone: "03-0000-0041" } }),
    prisma.user.create({ data: { email: "marketing2@example.com", name: "井上 奈緒", passwordHash: hashedPassword, role: "SALES", profileId: marketingProfile.id, department: "マーケティング", title: "マーケター", phone: "03-0000-0042" } }),
  ]);

  const support1 = await prisma.user.create({
    data: { email: "support1@example.com", name: "木村 隆", passwordHash: hashedPassword, role: "SALES", profileId: salesProfile.id, department: "サポート", title: "サポートスペシャリスト", phone: "03-0000-0051" },
  });

  void marketing1; void marketing2; void support1; void csmProfile; void marketingProfile;

  const salesUsers = [sales1, sales2, sales3, sales4, sales5, sales6];
  const csmUsers = [csm1, csm2];
  const seUsers = [se1, se2];
  const allUsers = [adminUser, director, manager1, manager2, sales1, sales2, sales3, sales4, sales5, sales6, se1, se2, csm1, csm2, marketing1, marketing2, support1];
  void allUsers;

  console.log(`✅ ${17}人のユーザーを作成`);

  // ===================== Tags =====================
  await Promise.all([
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

  // ===================== Companies (80) =====================
  console.log("🏢 企業を作成中...");

  // Hardcoded company data (80 entries) with deterministic domains
  const COMPANY_DATA = [
    // IT・ソフトウェア - SaaS (12)
    { name: "株式会社青葉テクノロジーズ",          domain: "aoba-tech",               industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社北斗システムズ",              domain: "hokuto-sys",              industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社ネクストウェーブ",             domain: "nextwave",                industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社大和クラウド",               domain: "yamato-cloud",            industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社日本橋データラボ",             domain: "nihombashi-datalab",      industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社六本木サイバー",              domain: "roppongi-cyber",          industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社銀座ソリューションズ",          domain: "ginza-solutions",         industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社神楽坂マーケット",             domain: "kagurazaka-market",       industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社八重洲プロダクト",             domain: "yaesu-product",           industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社鎌倉ワークス",               domain: "kamakura-works",          industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社札幌データサービス",            domain: "sapporo-data",            industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    { name: "株式会社アーバンリンク",              domain: "urbanlink",               industry: "IT・ソフトウェア",  subIndustry: "SaaS" },
    // IT・ソフトウェア - SI (8)
    { name: "株式会社金沢システム開発",             domain: "kanazawa-sysdev",         industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社広島モビリティ",              domain: "hiroshima-mobility",      industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社東雲フーズ",                 domain: "shinonome-foods",         industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社仙台ヘルスケア",              domain: "sendai-healthcare",       industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社横浜スマート物流",             domain: "yokohama-smartlogistics", industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社京都クラフト",               domain: "kyoto-craft",             industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社博多流通",                  domain: "hakata-ryutsu",           industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    { name: "株式会社新宿オフィスサポート",          domain: "shinjuku-officesupport",  industry: "IT・ソフトウェア",  subIndustry: "システムインテグレーション" },
    // 製造 - 電機精密 (5)
    { name: "株式会社藤沢精機",                  domain: "fujisawa-seiki",          industry: "製造",            subIndustry: "電機・精密機器" },
    { name: "株式会社山吹建設",                  domain: "yamabuki-kensetsu",       industry: "製造",            subIndustry: "電機・精密機器" },
    { name: "株式会社千歳インダストリー",            domain: "chitose-industry",        industry: "製造",            subIndustry: "電機・精密機器" },
    { name: "株式会社ミナト製作所",               domain: "minato-mfg",             industry: "製造",            subIndustry: "電機・精密機器" },
    { name: "株式会社東海ファイナンス",             domain: "tokai-finance",           industry: "製造",            subIndustry: "電機・精密機器" },
    // 製造 - 機械設備 (5)
    { name: "株式会社瀬戸内ロジスティクス",          domain: "setouchi-logistics",      industry: "製造",            subIndustry: "機械・設備" },
    { name: "株式会社オリオンリテール",             domain: "orion-retail",            industry: "製造",            subIndustry: "機械・設備" },
    { name: "株式会社グリーンフィールド",            domain: "greenfield",              industry: "製造",            subIndustry: "機械・設備" },
    { name: "株式会社ひばり薬局",                 domain: "hibari-pharmacy",         industry: "製造",            subIndustry: "機械・設備" },
    { name: "株式会社南青山メディア",              domain: "minamiayoyama-media",     industry: "製造",            subIndustry: "機械・設備" },
    // 金融 - 銀行信金 (4)
    { name: "株式会社北浜コンサルティング",          domain: "kitahama-consulting",     industry: "金融",            subIndustry: "銀行・信用金庫" },
    { name: "株式会社レイクサイドホテルズ",          domain: "lakeside-hotels",         industry: "金融",            subIndustry: "銀行・信用金庫" },
    { name: "株式会社ブルーム教育研究所",            domain: "bloom-edu",               industry: "金融",            subIndustry: "銀行・信用金庫" },
    { name: "株式会社クローバー食品",              domain: "clover-foods",            industry: "金融",            subIndustry: "銀行・信用金庫" },
    // 金融 - 保険 (4)
    { name: "株式会社すみれケア",                 domain: "sumire-care",             industry: "金融",            subIndustry: "保険" },
    { name: "株式会社桜井メディカル",              domain: "sakurai-medical",         industry: "金融",            subIndustry: "保険" },
    { name: "株式会社白金物流",                  domain: "shirogane-logistics",     industry: "金融",            subIndustry: "保険" },
    { name: "株式会社森川商事",                  domain: "morikawa-shoji",          industry: "金融",            subIndustry: "保険" },
    // 医療ヘルスケア - 医療機器 (4)
    { name: "株式会社晴海デザイン",               domain: "harumi-design",           industry: "医療・ヘルスケア",   subIndustry: "医療機器" },
    { name: "株式会社那覇トラベル",               domain: "naha-travel",             industry: "医療・ヘルスケア",   subIndustry: "医療機器" },
    { name: "株式会社東京ビジョン",               domain: "tokyo-vision",            industry: "医療・ヘルスケア",   subIndustry: "医療機器" },
    { name: "株式会社大阪イノベーションラボ",         domain: "osaka-innlab",            industry: "医療・ヘルスケア",   subIndustry: "医療機器" },
    // 医療ヘルスケア - 製薬 (4)
    { name: "株式会社名古屋デジタルファクトリー",      domain: "nagoya-digitalfactory",   industry: "医療・ヘルスケア",   subIndustry: "製薬" },
    { name: "株式会社神戸マリン",                 domain: "kobe-marine",             industry: "医療・ヘルスケア",   subIndustry: "製薬" },
    { name: "株式会社福岡グリーンエネルギー",         domain: "fukuoka-greenenergy",     industry: "医療・ヘルスケア",   subIndustry: "製薬" },
    { name: "株式会社浜松プレシジョン",             domain: "hamamatsu-precision",     industry: "医療・ヘルスケア",   subIndustry: "製薬" },
    // 流通小売 - Eコマース (4)
    { name: "株式会社長野アグリテック",             domain: "nagano-agritech",         industry: "流通・小売",       subIndustry: "Eコマース" },
    { name: "株式会社宮崎バイオサイエンス",           domain: "miyazaki-bioscience",     industry: "流通・小売",       subIndustry: "Eコマース" },
    { name: "株式会社熊本スマートシティ",            domain: "kumamoto-smartcity",      industry: "流通・小売",       subIndustry: "Eコマース" },
    { name: "株式会社静岡オーガニクス",             domain: "shizuoka-organics",       industry: "流通・小売",       subIndustry: "Eコマース" },
    // 流通小売 - 小売 (4)
    { name: "株式会社岐阜テキスタイル",             domain: "gifu-textile",            industry: "流通・小売",       subIndustry: "小売" },
    { name: "株式会社三重ケミカルズ",              domain: "mie-chemicals",           industry: "流通・小売",       subIndustry: "小売" },
    { name: "株式会社滋賀ウォーターテック",           domain: "shiga-watertech",         industry: "流通・小売",       subIndustry: "小売" },
    { name: "株式会社奈良ヘリテージ",              domain: "nara-heritage",           industry: "流通・小売",       subIndustry: "小売" },
    // 建設不動産 - 建設 (3)
    { name: "株式会社和歌山バイオマス",             domain: "wakayama-biomass",        industry: "建設・不動産",      subIndustry: "建設" },
    { name: "株式会社徳島サーキュラー",             domain: "tokushima-circular",      industry: "建設・不動産",      subIndustry: "建設" },
    { name: "株式会社高松マリンテック",             domain: "takamatsu-marinetech",    industry: "建設・不動産",      subIndustry: "建設" },
    // 建設不動産 - 不動産 (3)
    { name: "株式会社松山ロボティクス",             domain: "matsuyama-robotics",      industry: "建設・不動産",      subIndustry: "不動産" },
    { name: "株式会社高知エコシステムズ",            domain: "kochi-ecosystems",        industry: "建設・不動産",      subIndustry: "不動産" },
    { name: "株式会社長崎オーシャン",              domain: "nagasaki-ocean",          industry: "建設・不動産",      subIndustry: "不動産" },
    // 物流 (6)
    { name: "株式会社秋田フードサービス",            domain: "akita-food",              industry: "物流",            subIndustry: "物流・配送" },
    { name: "株式会社山形クリエイティブ",            domain: "yamagata-creative",       industry: "物流",            subIndustry: "物流・配送" },
    { name: "株式会社岩手スポーツサイエンス",         domain: "iwate-sports",            industry: "物流",            subIndustry: "物流・配送" },
    { name: "株式会社宮城テクスタイル",             domain: "miyagi-textile",          industry: "物流",            subIndustry: "物流・配送" },
    { name: "株式会社青森マリン",                 domain: "aomori-marine",           industry: "物流",            subIndustry: "物流・配送" },
    { name: "株式会社北海道ファームテック",           domain: "hokkaido-farmtech",       industry: "物流",            subIndustry: "物流・配送" },
    // 教育 (5)
    { name: "株式会社富山ハーモニー",              domain: "toyama-harmony",          industry: "教育",            subIndustry: "EdTech" },
    { name: "株式会社石川クラフト",               domain: "ishikawa-craft",          industry: "教育",            subIndustry: "EdTech" },
    { name: "株式会社福井マニュファクチャリング",      domain: "fukui-mfg",               industry: "教育",            subIndustry: "EdTech" },
    { name: "株式会社山梨ナチュラル",              domain: "yamanashi-natural",       industry: "教育",            subIndustry: "EdTech" },
    { name: "株式会社長野アルプスコープ",            domain: "nagano-alpscope",         industry: "教育",            subIndustry: "EdTech" },
    // 食品飲食 (4)
    { name: "株式会社栃木グリーン",               domain: "tochigi-green",           industry: "食品・飲食",       subIndustry: "食品製造" },
    { name: "株式会社群馬アドバンスド",             domain: "gunma-advanced",          industry: "食品・飲食",       subIndustry: "食品製造" },
    { name: "株式会社茨城インダストリアル",           domain: "ibaraki-industrial",      industry: "食品・飲食",       subIndustry: "食品製造" },
    { name: "株式会社千葉マーケットプレイス",         domain: "chiba-marketplace",       industry: "食品・飲食",       subIndustry: "食品製造" },
    // 商社 (5)
    { name: "株式会社埼玉テクノロジー",             domain: "saitama-tech",            industry: "商社",            subIndustry: "総合商社" },
    { name: "株式会社神奈川インテグレーション",        domain: "kanagawa-integration",    industry: "商社",            subIndustry: "総合商社" },
    { name: "株式会社東京メトロポリタン",            domain: "tokyo-metropolitan",      industry: "商社",            subIndustry: "総合商社" },
    { name: "株式会社大阪ビジネスソリューション",      domain: "osaka-bizsoln",           industry: "商社",            subIndustry: "総合商社" },
    { name: "株式会社九州デジタルハブ",             domain: "kyushu-digitalhub",       industry: "商社",            subIndustry: "総合商社" },
  ] as const;

  const tiers = ["STRATEGIC", "ENTERPRISE", "MID_MARKET", "SMB"] as const;
  const lifecycleStages = ["TARGET", "LEAD", "OPPORTUNITY", "CUSTOMER", "EXPANSION"] as const;

  // tier distribution: 5 STRATEGIC, 15 ENTERPRISE, 30 MID_MARKET, 30 SMB
  // lifecycleStage distribution: TARGET(10), LEAD(15), OPPORTUNITY(20), CUSTOMER(25), EXPANSION(10)
  const tierPool: (typeof tiers[number])[] = [
    ...Array(5).fill("STRATEGIC"),
    ...Array(15).fill("ENTERPRISE"),
    ...Array(30).fill("MID_MARKET"),
    ...Array(30).fill("SMB"),
  ];
  const stagePool: (typeof lifecycleStages[number])[] = [
    ...Array(10).fill("TARGET"),
    ...Array(15).fill("LEAD"),
    ...Array(20).fill("OPPORTUNITY"),
    ...Array(25).fill("CUSTOMER"),
    ...Array(10).fill("EXPANSION"),
  ];

  const annualRevenueByTier: Record<string, [number, number]> = {
    STRATEGIC: [200_000_000_000, 1_000_000_000_000],
    ENTERPRISE: [30_000_000_000, 200_000_000_000],
    MID_MARKET: [5_000_000_000, 30_000_000_000],
    SMB: [500_000_000, 5_000_000_000],
  };

  const companies: Array<{ id: string; companyName: string; lifecycleStage: string; ownerId: string; type: string }> = [];

  for (let companyIdx = 0; companyIdx < COMPANY_DATA.length; companyIdx++) {
    const cd = COMPANY_DATA[companyIdx];
    const tier = tierPool[companyIdx % tierPool.length];
    const lifecycleStage = stagePool[companyIdx % stagePool.length];
    const owner = salesUsers[companyIdx % salesUsers.length];
    const accountManager = salesUsers[(companyIdx + 1) % salesUsers.length];
    const isCustomer = lifecycleStage === "CUSTOMER" || lifecycleStage === "EXPANSION";
    const csmUser = isCustomer ? csmUsers[companyIdx % csmUsers.length] : null;

    const [minRev, maxRev] = annualRevenueByTier[tier];
    const annualRevenue = randomBetween(minRev / 1_000_000, maxRev / 1_000_000) * 1_000_000;

    let arr: number | null = null;
    if (isCustomer) {
      const arrRanges: Record<string, [number, number]> = {
        STRATEGIC: [20_000_000, 500_000_000],
        ENTERPRISE: [5_000_000, 50_000_000],
        MID_MARKET: [1_000_000, 10_000_000],
        SMB: [300_000, 3_000_000],
      };
      const [minArr, maxArr] = arrRanges[tier];
      arr = randomBetween(minArr / 10_000, maxArr / 10_000) * 10_000;
    }

    const employeeSizes: Record<string, string[]> = {
      STRATEGIC: ["5000名以上", "1000名以上"],
      ENTERPRISE: ["1000名以上", "500-1000名"],
      MID_MARKET: ["100-500名", "50-100名"],
      SMB: ["10-50名", "50-100名"],
    };
    const employeeSize = pick(employeeSizes[tier]);
    const healthScore = isCustomer
      ? (lifecycleStage === "EXPANSION" ? randomBetween(65, 95) : randomBetween(50, 90))
      : null;
    const companyType = isCustomer ? "CUSTOMER" : "PROSPECT";

    const company = await prisma.company.create({
      data: {
        companyName: cd.name,
        industry: cd.industry,
        subIndustry: cd.subIndustry,
        website: `https://${cd.domain}.example.jp`,
        employeeSize,
        status: isCustomer ? "active" : "prospect",
        type: companyType,
        ownerName: owner.name ?? undefined,
        ownerId: owner.id,
        accountManagerId: accountManager.id,
        customerSuccessManagerId: csmUser?.id ?? undefined,
        tier,
        lifecycleStage,
        annualRevenue,
        arr: arr ?? undefined,
        mrr: arr ? Math.floor(arr / 12) : undefined,
        healthScore: healthScore ?? undefined,
        domain: `${cd.domain}.example.jp`,
        billingCountry: "日本",
        billingPrefecture: pick(["東京都", "大阪府", "愛知県", "神奈川県", "福岡県", "北海道"]),
        businessSummary: `${cd.name}は${cd.industry}業界のリーディングカンパニーです。`,
        painPoints: ["業務効率化", "コスト削減", "デジタル変革"],
        objectives: ["売上拡大", "顧客満足度向上", "DX推進"],
        technologies: pick([["AWS", "Salesforce"], ["Azure", "SAP"], ["GCP", "Slack"], ["AWS", "kintone"]]),
        openPipelineAmount: randomBetween(0, 50_000_000),
        wonAmount: isCustomer ? randomBetween(1_000_000, 100_000_000) : 0,
        renewalDate: isCustomer ? daysFromNow(randomBetween(30, 365)) : null,
      },
    });

    companies.push({ id: company.id, companyName: company.companyName, lifecycleStage, ownerId: owner.id, type: companyType });
  }

  console.log(`✅ ${companies.length}社の企業を作成`);

  // ===================== Contacts (~280) =====================
  console.log("👥 コンタクトを作成中...");

  // Contact name pools
  const lastNames = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "山崎", "森", "池田", "橋本", "阿部", "石川", "前田", "藤田", "岡田", "長谷川", "村上"];
  const maleFirstNames = ["太郎", "健一", "大輔", "拓也", "誠", "翔太", "直樹", "裕介", "和也", "俊介", "智也", "達也", "圭", "慎也", "亮"];
  const femaleFirstNames = ["花子", "美咲", "優子", "彩", "由美", "恵", "真由", "葵", "千尋", "里奈", "麻衣", "奈々", "沙織", "愛", "美穂"];

  // Romaji lookup for email addresses
  const lastNameRomaji: Record<string, string> = {
    "佐藤": "sato", "鈴木": "suzuki", "高橋": "takahashi", "田中": "tanaka", "伊藤": "ito",
    "渡辺": "watanabe", "山本": "yamamoto", "中村": "nakamura", "小林": "kobayashi", "加藤": "kato",
    "吉田": "yoshida", "山田": "yamada", "佐々木": "sasaki", "山口": "yamaguchi", "松本": "matsumoto",
    "井上": "inoue", "木村": "kimura", "林": "hayashi", "清水": "shimizu", "山崎": "yamazaki",
    "森": "mori", "池田": "ikeda", "橋本": "hashimoto", "阿部": "abe", "石川": "ishikawa",
    "前田": "maeda", "藤田": "fujita", "岡田": "okada", "長谷川": "hasegawa", "村上": "murakami",
  };
  const firstNameRomaji: Record<string, string> = {
    "太郎": "taro", "健一": "kenichi", "大輔": "daisuke", "拓也": "takuya", "誠": "makoto",
    "翔太": "shota", "直樹": "naoki", "裕介": "yusuke", "和也": "kazuya", "俊介": "shunsuke",
    "智也": "tomoya", "達也": "tatsuya", "圭": "kei", "慎也": "shinya", "亮": "ryo",
    "花子": "hanako", "美咲": "misaki", "優子": "yuko", "彩": "aya", "由美": "yumi",
    "恵": "megumi", "真由": "mayu", "葵": "aoi", "千尋": "chihiro", "里奈": "rina",
    "麻衣": "mai", "奈々": "nana", "沙織": "saori", "愛": "ai", "美穂": "miho",
  };

  const decisionRoles = ["意思決定者", "評価担当", "情シス担当", "現場担当", "購買担当"];
  const titlesByIndustry: Record<string, string[]> = {
    "IT・ソフトウェア": ["CTO", "IT部長", "システム部長", "情報システム課長", "DX推進部長", "開発部長", "IT戦略部長"],
    "製造": ["生産管理部長", "工場長", "IT推進部長", "調達部長", "品質管理部長"],
    "金融": ["デジタル戦略部長", "システム統括部長", "情報企画部長", "リスク管理部長"],
    "医療・ヘルスケア": ["医療情報部長", "事務長", "院長", "システム管理者", "業務改革担当"],
    "流通・小売": ["EC事業部長", "デジタル推進部長", "営業部長", "マーケティング部長"],
    "建設・不動産": ["DX推進室長", "情報システム部長", "技術部長"],
    "物流": ["物流改革部長", "情報システム部長", "オペレーション部長"],
    "教育": ["学習DX推進部長", "教育技術部長", "事務局長"],
    "食品・飲食": ["生産管理部長", "IT推進部長", "品質管理部長"],
    "商社": ["デジタル変革部長", "情報システム部長", "調達本部長"],
  };

  const contacts: Array<{ id: string; companyId: string }> = [];
  const companyContacts: Map<string, string[]> = new Map();

  for (let ci = 0; ci < companies.length; ci++) {
    const company = companies[ci];
    const cd = COMPANY_DATA[ci];
    const numContacts = 3 + (ci % 2); // 3 or 4 contacts per company
    const industryTitles = titlesByIndustry[cd.industry] ?? titlesByIndustry["IT・ソフトウェア"];

    const contactsForCompany: string[] = [];

    for (let j = 0; j < numContacts; j++) {
      // Deterministic name selection using prime-based indexing to avoid duplicates
      const lastNameIdx = (ci * 7 + j * 13) % lastNames.length;
      const isMale = (ci + j) % 3 !== 0;
      const firstNamePool = isMale ? maleFirstNames : femaleFirstNames;
      const firstNameIdx = (ci * 11 + j * 17) % firstNamePool.length;

      const lastName = lastNames[lastNameIdx];
      const firstName = firstNamePool[firstNameIdx];
      const fullName = `${lastName} ${firstName}`;

      const lastRomaji = lastNameRomaji[lastName] ?? "contact";
      const firstRomaji = firstNameRomaji[firstName] ?? "user";

      const roleInDecision = decisionRoles[j % decisionRoles.length];
      const title = j === 0
        ? industryTitles[ci % industryTitles.length]
        : ["課長", "主任", "マネージャー", "シニアエンジニア", "スペシャリスト"][j % 5];
      const dept = ["情報システム部", "経営企画部", "IT推進部", "購買部", "業務改革室", "DX推進部"][j % 6];

      const contact = await prisma.contact.create({
        data: {
          companyId: company.id,
          fullName,
          firstName,
          lastName,
          email: `${firstRomaji}.${lastRomaji}@${cd.domain}.example.jp`,
          phone: `0${3 + (ci % 7)}-${String(1000 + ci * 3 + j).padStart(4, "0")}-${String(2000 + ci + j * 7).padStart(4, "0")}`,
          department: dept,
          title,
          roleInDecision,
          isPrimary: j === 0,
          ownerId: company.ownerId,
          memo: j === 0 ? `${company.companyName}の主要担当者。${roleInDecision}として関わっている。` : null,
        },
      });

      contacts.push({ id: contact.id, companyId: company.id });
      contactsForCompany.push(contact.id);
    }

    companyContacts.set(company.id, contactsForCompany);
  }

  console.log(`✅ ${contacts.length}件のコンタクトを作成`);

  // ===================== Deals (~190) =====================
  console.log("💼 商談を作成中...");

  interface DealConfig {
    stage: string;
    count: number;
    probMin: number;
    probMax: number;
    amountMin: number;
    amountMax: number;
    forecastCategory: string;
    closeDateOffsetMin: number;
    closeDateOffsetMax: number;
    isWon?: boolean;
    isLost?: boolean;
  }

  const dealConfigs: DealConfig[] = [
    { stage: "qualification",     count: 30, probMin: 5,  probMax: 15, amountMin: 500_000,    amountMax: 20_000_000,  forecastCategory: "PIPELINE",  closeDateOffsetMin: 60,  closeDateOffsetMax: 180 },
    { stage: "needs_analysis",    count: 30, probMin: 20, probMax: 35, amountMin: 1_000_000,  amountMax: 50_000_000,  forecastCategory: "PIPELINE",  closeDateOffsetMin: 45,  closeDateOffsetMax: 150 },
    { stage: "value_proposition", count: 20, probMin: 35, probMax: 50, amountMin: 1_500_000,  amountMax: 60_000_000,  forecastCategory: "PIPELINE",  closeDateOffsetMin: 40,  closeDateOffsetMax: 130 },
    { stage: "proposal",          count: 25, probMin: 40, probMax: 60, amountMin: 2_000_000,  amountMax: 80_000_000,  forecastCategory: "PIPELINE",  closeDateOffsetMin: 30,  closeDateOffsetMax: 120 },
    { stage: "negotiation",       count: 20, probMin: 65, probMax: 80, amountMin: 5_000_000,  amountMax: 150_000_000, forecastCategory: "BEST_CASE", closeDateOffsetMin: 15,  closeDateOffsetMax: 60 },
    { stage: "final_review",      count: 15, probMin: 85, probMax: 95, amountMin: 10_000_000, amountMax: 200_000_000, forecastCategory: "COMMIT",    closeDateOffsetMin: 7,   closeDateOffsetMax: 45 },
    { stage: "won",               count: 30, probMin: 100,probMax: 100,amountMin: 3_000_000,  amountMax: 100_000_000, forecastCategory: "CLOSED",    closeDateOffsetMin: -90, closeDateOffsetMax: -1, isWon: true },
    { stage: "lost",              count: 20, probMin: 0,  probMax: 0,  amountMin: 1_000_000,  amountMax: 50_000_000,  forecastCategory: "CLOSED",    closeDateOffsetMin: -60, closeDateOffsetMax: -1, isLost: true },
  ];

  const lostReasons = ["価格が合わなかった", "競合他社に負けた", "予算凍結", "担当者変更", "導入延期", "要件不一致"];
  const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

  // Owner distribution weights
  const dealOwnerPool: typeof salesUsers[number][] = [
    ...Array(30).fill(sales1),
    ...Array(25).fill(sales2),
    ...Array(25).fill(sales4),
    ...Array(20).fill(sales3),
    ...Array(18).fill(sales5),
    ...Array(14).fill(sales6),
    ...Array(12).fill(manager1),
    ...Array(12).fill(manager2),
  ];

  const dealNameTemplates = [
    (cn: string) => `${cn} 顧客管理基盤刷新プロジェクト`,
    (cn: string) => `${cn} 営業支援ツール導入`,
    (cn: string) => `${cn} MA連携システム構築`,
    (cn: string) => `${cn} データ分析基盤導入`,
    (cn: string) => `${cn} 契約管理システム刷新`,
    (cn: string) => `${cn} 問い合わせ管理高度化`,
    (cn: string) => `${cn} 受発注業務デジタル化`,
    (cn: string) => `${cn} 会員管理システム更新`,
    (cn: string) => `${cn} ERP連携プロジェクト`,
    (cn: string) => `${cn} カスタマーサポート基盤導入`,
    (cn: string) => `${cn} 営業レポート自動化`,
    (cn: string) => `${cn} セキュリティ監査対応`,
  ];

  const deals: Array<{ id: string; companyId: string; stage: string; ownerId: string }> = [];
  let dealIdx = 0;

  for (const config of dealConfigs) {
    for (let i = 0; i < config.count; i++) {
      const company = companies[(dealIdx * 3 + i) % companies.length];
      const companyContactList = companyContacts.get(company.id) ?? [];
      const contactId = companyContactList[0] ?? null;
      const owner = dealOwnerPool[dealIdx % dealOwnerPool.length];
      const se = dealIdx % 5 < 2 ? seUsers[dealIdx % seUsers.length] : null;

      const prob = randomBetween(config.probMin, config.probMax);
      const amount = randomBetween(config.amountMin / 10_000, config.amountMax / 10_000) * 10_000;
      const closeDate = daysFromNow(randomBetween(config.closeDateOffsetMin, config.closeDateOffsetMax));
      const riskLevel = config.isWon || config.isLost ? null : pick(["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"] as typeof riskLevels[number][]);
      const lastActivityAt = config.isWon || config.isLost
        ? daysAgo(randomBetween(1, 90))
        : (dealIdx % 5 < 4 ? daysAgo(randomBetween(0, 30)) : (dealIdx % 10 < 1 ? null : daysAgo(randomBetween(31, 90))));

      const dealName = dealNameTemplates[dealIdx % dealNameTemplates.length](company.companyName);

      const deal = await prisma.deal.create({
        data: {
          companyId: company.id,
          contactId,
          dealName,
          stage: config.stage,
          forecastCategory: config.forecastCategory,
          type: pick(["NEW_BUSINESS", "EXPANSION", "RENEWAL"]),
          amount,
          probability: prob,
          expectedCloseDate: config.isWon || config.isLost ? null : closeDate,
          closeDate: config.isWon || config.isLost ? closeDate : null,
          ownerId: owner.id,
          salesRepId: owner.id,
          salesEngineerId: se?.id ?? null,
          riskLevel,
          lostReason: config.isLost ? pick(lostReasons) : null,
          lastActivityAt,
          memo: `${company.companyName}との${config.stage}フェーズの商談。担当: ${owner.name}`,
          nextAction: config.isWon || config.isLost ? null : pick([
            "提案書を送付する", "デモを実施する", "ヒアリングを行う", "見積もりを提出する", "役員プレゼンを調整する", "フォローアップコールをする",
          ]),
        },
      });

      deals.push({ id: deal.id, companyId: company.id, stage: config.stage, ownerId: owner.id });
      dealIdx++;
    }
  }

  console.log(`✅ ${deals.length}件の商談を作成`);

  // ===================== Activities (1500) =====================
  console.log("📋 活動を作成中...");

  const activityTypes = ["CALL", "EMAIL", "MEETING", "DEMO", "PROPOSAL", "NEGOTIATION", "FOLLOW_UP", "NOTE"] as const;
  const outcomes = ["POSITIVE", "NEUTRAL", "NEGATIVE", "NO_RESPONSE", "NEXT_STEP_CREATED", "COMPLETED"] as const;

  const subjectTemplatesByType: Record<typeof activityTypes[number], string[]> = {
    CALL: ["定期コール", "フォローアップコール", "状況確認コール", "初回コール", "提案後フォローコール"],
    EMAIL: ["提案資料送付", "議事録送付", "見積書送付", "フォローアップメール", "情報提供メール"],
    MEETING: ["キックオフMTG", "ヒアリング商談", "レビューMTG", "デモ後MTG", "役員プレゼン"],
    DEMO: ["製品デモ", "POC説明", "機能紹介デモ", "カスタムデモ"],
    PROPOSAL: ["提案", "ROI提案", "初回提案", "追加提案"],
    NEGOTIATION: ["価格交渉", "契約条件調整", "最終交渉"],
    FOLLOW_UP: ["フォローアップ", "検討状況確認", "次回日程調整"],
    NOTE: ["情報更新", "商談メモ", "社内共有メモ", "会議メモ"],
  };

  const outcomeWeights = [
    ...Array(30).fill("POSITIVE"),
    ...Array(30).fill("NEUTRAL"),
    ...Array(10).fill("NEGATIVE"),
    ...Array(15).fill("NO_RESPONSE"),
    ...Array(10).fill("NEXT_STEP_CREATED"),
    ...Array(5).fill("COMPLETED"),
  ] as (typeof outcomes[number])[];

  // User activity targets: sales1=310, sales2=260, sales4=250, sales3=200, sales5=180, sales6=140, mgr1=80, mgr2=80 = 1500
  const userActivityTargets: Array<{ user: typeof salesUsers[number]; count: number }> = [
    { user: sales1, count: 310 },
    { user: sales2, count: 260 },
    { user: sales4, count: 250 },
    { user: sales3, count: 200 },
    { user: sales5, count: 180 },
    { user: sales6, count: 140 },
    { user: manager1, count: 80 },
    { user: manager2, count: 80 },
  ];

  // Pre-build overdue activity dates pool: ~50 activities between 2026-04-01 and 2026-05-10
  let overdueCount = 0;
  const maxOverdue = 50;

  const activityCountByDeal: Map<string, { total: number; meeting: number; call: number; email: number; lastDate: Date | null }> = new Map();
  const activityCountByCompany: Map<string, Date | null> = new Map();

  for (const d of deals) {
    activityCountByDeal.set(d.id, { total: 0, meeting: 0, call: 0, email: 0, lastDate: null });
  }
  for (const c of companies) {
    activityCountByCompany.set(c.id, null);
  }

  let totalActivitiesCreated = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allActivityData: any[] = [];

  for (const { user, count } of userActivityTargets) {
    // Get deals owned by this user
    const userDeals = deals.filter((d) => d.ownerId === user.id);
    const userCompanies = companies.filter((c) => c.ownerId === user.id);

    for (let i = 0; i < count; i++) {
      // Assign to deal or just company
      const hasDeals = userDeals.length > 0;
      const useDeal = hasDeals && i % 3 !== 2; // 2/3 linked to deals

      let dealId: string | null = null;
      let companyId: string | null = null;
      let contactId: string | null = null;

      if (useDeal) {
        const deal = userDeals[i % userDeals.length];
        dealId = deal.id;
        companyId = deal.companyId;
        const contactList = companyContacts.get(companyId) ?? [];
        contactId = contactList[i % Math.max(contactList.length, 1)] ?? null;
      } else {
        const company = userCompanies.length > 0 ? userCompanies[i % userCompanies.length] : companies[i % companies.length];
        companyId = company.id;
        const contactList = companyContacts.get(companyId) ?? [];
        contactId = contactList[0] ?? null;
      }

      const actType = activityTypes[i % activityTypes.length];
      const subjectTemplates = subjectTemplatesByType[actType];
      const subjectTemplate = subjectTemplates[i % subjectTemplates.length];
      const companyName = companyId ? (companies.find((c) => c.id === companyId)?.companyName ?? "取引先") : "取引先";
      const subject = `${companyName} ${subjectTemplate}`;

      // Date distribution: 60% last 3 months, 30% 3-6 months, 10% 6-12 months
      let activityDate: Date;
      const r = i % 10;
      if (r < 6) {
        activityDate = daysAgo(randomBetween(0, 90));
      } else if (r < 9) {
        activityDate = daysAgo(randomBetween(91, 180));
      } else {
        activityDate = daysAgo(randomBetween(181, 365));
      }

      const outcome = pick(outcomeWeights);

      // nextActionDueDate: ~50 overdue
      let nextActionDueDate: Date | null = null;
      if (overdueCount < maxOverdue && i % 12 === 0) {
        const overdueDay = randomBetween(6, 45);
        nextActionDueDate = daysAgo(overdueDay); // past = overdue
        overdueCount++;
      } else if (outcome === "NEXT_STEP_CREATED" || outcome === "POSITIVE") {
        nextActionDueDate = daysFromNow(randomBetween(3, 30));
      }

      allActivityData.push({
        companyId,
        contactId,
        dealId,
        type: actType.toLowerCase(),
        subject,
        body: `${subject}を実施。${outcome === "POSITIVE" ? "良い反応あり。前向きに検討中。" : outcome === "NEGATIVE" ? "厳しい状況。再アプローチが必要。" : "通常の対応を実施。"}`,
        outcome,
        ownerId: user.id,
        createdById: user.id,
        activityDate,
        nextAction: nextActionDueDate ? "次回アクションの実施" : null,
        nextActionDueDate,
        durationMinutes: actType === "MEETING" ? randomBetween(30, 120) : actType === "CALL" ? randomBetween(5, 45) : null,
      });

      // Update counters (tracked in memory)
      if (dealId) {
        const counters = activityCountByDeal.get(dealId)!;
        counters.total++;
        if (actType === "MEETING") counters.meeting++;
        if (actType === "CALL") counters.call++;
        if (actType === "EMAIL") counters.email++;
        if (!counters.lastDate || activityDate > counters.lastDate) counters.lastDate = activityDate;
        activityCountByDeal.set(dealId, counters);
      }
      if (companyId) {
        const lastDate = activityCountByCompany.get(companyId);
        if (!lastDate || activityDate > lastDate) {
          activityCountByCompany.set(companyId, activityDate);
        }
      }

      totalActivitiesCreated++;
    }
  }

  // Batch create activities in chunks of 200 for efficiency
  const CHUNK = 200;
  for (let i = 0; i < allActivityData.length; i += CHUNK) {
    const chunk = allActivityData.slice(i, i + CHUNK);
    await prisma.activity.createMany({ data: chunk });
  }

  console.log(`✅ ${totalActivitiesCreated}件の活動を作成`);

  // Update deal activity counts in parallel batches
  console.log("🔄 商談の活動カウントを更新中...");
  const dealUpdateEntries = [...activityCountByDeal.entries()].filter(([, c]) => c.total > 0);
  for (let i = 0; i < dealUpdateEntries.length; i += 20) {
    await Promise.all(
      dealUpdateEntries.slice(i, i + 20).map(([dealId, counters]) =>
        prisma.deal.update({
          where: { id: dealId },
          data: {
            activityCount: counters.total,
            meetingCount: counters.meeting,
            callCount: counters.call,
            emailCount: counters.email,
            lastActivityAt: counters.lastDate,
          },
        })
      )
    );
  }

  // Update company lastActivityAt in parallel batches
  console.log("🔄 企業の最終活動日を更新中...");
  const companyUpdateEntries = [...activityCountByCompany.entries()].filter(([, d]) => d != null);
  for (let i = 0; i < companyUpdateEntries.length; i += 20) {
    await Promise.all(
      companyUpdateEntries.slice(i, i + 20).map(([companyId, lastDate]) =>
        prisma.company.update({
          where: { id: companyId },
          data: { lastActivityAt: lastDate },
        })
      )
    );
  }

  // ===================== Tasks (500) =====================
  console.log("✅ タスクを作成中...");

  const taskTitles = [
    "提案書の作成", "見積書の送付", "デモ環境の準備", "ヒアリングシートの整理",
    "役員プレゼン資料作成", "契約書ドラフト確認", "フォローアップメールの送信",
    "競合比較資料の作成", "ROI試算の更新", "顧客との日程調整",
    "内部レビューの実施", "承認依頼の提出", "技術検証の実施", "セキュリティ要件確認",
    "PoC計画書作成", "次回MTGの準備", "議事録の送付", "課題リストの更新",
    "参考情報の収集", "社内共有会の準備",
  ];

  const taskPriorities = ["high", "medium", "low"] as const;
  // 200 done, 150 in_progress, 150 todo, ~80 overdue (non-done, past dueDate)
  const taskStatusPool = [
    ...Array(200).fill("done"),
    ...Array(150).fill("in_progress"),
    ...Array(150).fill("todo"),
  ];

  const allTaskData = [];
  for (let i = 0; i < 500; i++) {
    const status = taskStatusPool[i] ?? "todo";
    const assignee = salesUsers[i % salesUsers.length];
    const company = companies[i % companies.length];
    const deal = i % 3 !== 2 ? deals[i % deals.length] : null;
    const priority = taskPriorities[i % taskPriorities.length];

    let dueDate: Date;
    const isOverdue = i >= 350 && i < 430; // ~80 overdue tasks
    if (status === "done") {
      dueDate = daysAgo(randomBetween(1, 60));
    } else if (isOverdue) {
      dueDate = daysAgo(randomBetween(1, 45));
    } else {
      dueDate = daysFromNow(randomBetween(1, 60));
    }

    allTaskData.push({
      companyId: company.id,
      dealId: deal?.id ?? null,
      assigneeId: assignee.id,
      title: taskTitles[i % taskTitles.length],
      description: `${company.companyName}に関する${taskTitles[i % taskTitles.length]}を実施する。担当: ${assignee.name}`,
      dueDate,
      priority,
      status,
    });
  }
  await prisma.task.createMany({ data: allTaskData });

  console.log("✅ 500件のタスクを作成");

  // ===================== Cases (CUSTOMER/EXPANSION only) =====================
  console.log("📁 ケースを作成中...");

  const caseSubjects = [
    "ログインできない", "データが同期しない", "レポートが表示されない",
    "インポートエラーが発生する", "メール送信が失敗する", "APIが応答しない",
    "パフォーマンスが遅い", "設定変更が反映されない", "エクスポートが失敗する",
    "通知が届かない", "ダッシュボードが読み込めない", "検索結果が不正確",
    "カスタムフィールドが保存されない", "CSVインポートで文字化けする",
  ];
  const caseStatuses = ["New", "Open", "Pending Customer", "Closed"] as const;
  const casePriorities = ["Critical", "High", "Medium", "Low"] as const;
  const caseTypes = ["Question", "Bug", "Feature Request", "Other"] as const;
  const caseOrigins = ["Email", "Phone", "Web", "Chat"] as const;

  // Only create cases for CUSTOMER and EXPANSION companies
  const customerCompanies = companies.filter(c => c.lifecycleStage === "CUSTOMER" || c.lifecycleStage === "EXPANSION");

  const allCaseData = [];
  let caseCounter = 0;
  for (let ci = 0; ci < customerCompanies.length; ci++) {
    const company = customerCompanies[ci];
    const maxCases = company.lifecycleStage === "EXPANSION" ? 6 : 5;
    const numCases = 1 + (ci % maxCases); // 1 to maxCases cases per company
    for (let j = 0; j < numCases; j++) {
      caseCounter++;
      const status = caseStatuses[(ci + j) % caseStatuses.length];
      const caseNumber = `C-2026-${String(caseCounter).padStart(4, "0")}`;
      allCaseData.push({
        caseNumber,
        subject: caseSubjects[(ci * 3 + j) % caseSubjects.length],
        description: `${company.companyName}より報告。詳細な再現手順と環境情報を確認中。`,
        status,
        priority: casePriorities[(ci + j) % casePriorities.length],
        type: caseTypes[(ci + j) % caseTypes.length],
        origin: caseOrigins[(ci + j) % caseOrigins.length],
        companyId: company.id,
        ownerId: salesUsers[(ci + j) % salesUsers.length].id,
        resolvedAt: status === "Closed" ? daysAgo(randomBetween(1, 30)) : null,
        resolution: status === "Closed" ? "設定を修正して問題を解決しました。" : null,
      });
    }
  }
  await prisma.case.createMany({ data: allCaseData });

  console.log(`✅ ${allCaseData.length}件のケースを作成`);

  // ===================== Contracts (CUSTOMER/EXPANSION only) =====================
  console.log("📄 契約を作成中...");

  const contractStatuses = ["Active", "Draft", "Expired"] as const;
  let contractCounter = 0;
  for (let ci = 0; ci < customerCompanies.length; ci++) {
    const company = customerCompanies[ci];
    const maxContracts = company.lifecycleStage === "EXPANSION" ? 3 : 3;
    const numContracts = 1 + (ci % maxContracts); // 1 to 3
    for (let j = 0; j < numContracts; j++) {
      contractCounter++;
      const contractNumber = `CON-2026-${String(contractCounter).padStart(4, "0")}`;
      // First contract is always Active; extras may be Draft or Expired for CUSTOMER
      let status: string;
      if (j === 0) {
        status = "Active";
      } else if (company.lifecycleStage === "EXPANSION") {
        status = "Active";
      } else {
        status = contractStatuses[1 + (j % 2)]; // Draft or Expired
      }
      const startDate = daysAgo(randomBetween(30, 365));
      const endDate = status === "Expired"
        ? daysAgo(randomBetween(1, 90))
        : daysFromNow(randomBetween(30, 365));
      await prisma.contract.create({
        data: {
          companyId: company.id,
          name: `${company.companyName} ${["年間保守契約", "SaaS利用契約", "システム導入契約"][j % 3]}`,
          contractNumber,
          status,
          startDate,
          endDate,
          contractValue: randomBetween(500_000, 50_000_000),
          ownerId: company.ownerId,
        },
      });
    }
  }
  console.log(`✅ ${contractCounter}件の契約を作成`);

  // ===================== Orders (CUSTOMER/EXPANSION only) =====================
  console.log("🛒 注文を作成中...");

  const orderStatuses = ["Activated", "Draft", "Cancelled"] as const;
  let orderCounter = 0;
  for (let ci = 0; ci < customerCompanies.length; ci++) {
    const company = customerCompanies[ci];
    const maxOrders = company.lifecycleStage === "EXPANSION" ? 5 : 4;
    const numOrders = 1 + (ci % maxOrders); // 1 to maxOrders
    for (let j = 0; j < numOrders; j++) {
      orderCounter++;
      const orderNumber = `ORD-2026-${String(orderCounter).padStart(4, "0")}`;
      const status = orderStatuses[(ci + j) % orderStatuses.length];
      await prisma.order.create({
        data: {
          companyId: company.id,
          orderNumber,
          status,
          orderDate: daysAgo(randomBetween(1, 180)),
          totalAmount: randomBetween(100_000, 10_000_000),
          ownerId: company.ownerId,
        },
      });
    }
  }
  console.log(`✅ ${orderCounter}件の注文を作成`);

  // ===================== Reports (10) =====================
  console.log("📊 レポートを作成中...");

  const reportDefs = [
    {
      name: "商談パイプライン一覧",
      objectType: "deal",
      columns: ["dealName", "stage", "amount", "probability", "expectedCloseDate", "company.companyName", "owner.name"],
      description: "全商談のパイプライン一覧",
      sortField: "expectedCloseDate",
      sortDir: "asc",
      filters: [{ field: "stage", operator: "not_in", value: ["won", "lost"] as string[] }],
    },
    {
      name: "ステージ別商談サマリー",
      objectType: "deal",
      columns: ["stage", "amount", "probability"],
      description: "ステージ別の商談集計",
      sortField: "amount",
      sortDir: "desc",
      groupBy: "stage",
      filters: [],
    },
    {
      name: "取引先一覧",
      objectType: "company",
      columns: ["companyName", "industry", "tier", "lifecycleStage", "healthScore", "arr", "owner.name"],
      description: "全取引先企業の一覧",
      sortField: "companyName",
      sortDir: "asc",
      filters: [],
    },
    {
      name: "活動タイムライン",
      objectType: "activity",
      columns: ["type", "subject", "activityDate", "outcome", "company.companyName", "owner.name"],
      description: "直近の活動履歴タイムライン",
      sortField: "activityDate",
      sortDir: "desc",
      filters: [],
    },
    {
      name: "タスク一覧",
      objectType: "task",
      columns: ["title", "status", "priority", "dueDate", "assignee.name", "company.companyName"],
      description: "全タスクの一覧",
      sortField: "dueDate",
      sortDir: "asc",
      filters: [],
    },
    {
      name: "商談ファネル分析",
      objectType: "deal",
      columns: ["stage", "amount"],
      description: "商談のステージ別ファネル分析",
      sortField: null,
      sortDir: "desc",
      groupBy: "stage",
      filters: [],
    },
    {
      name: "営業担当者別活動サマリー",
      objectType: "activity",
      columns: ["owner.name", "type"],
      description: "担当者別の活動タイプ集計",
      sortField: null,
      sortDir: "desc",
      groupBy: "owner.name",
      filters: [],
    },
    {
      name: "営業担当者別パイプライン",
      objectType: "deal",
      columns: ["owner.name", "stage", "amount"],
      description: "担当者別の商談パイプライン",
      sortField: "amount",
      sortDir: "desc",
      groupBy: "owner.name",
      filters: [{ field: "stage", operator: "not_in", value: ["won", "lost"] as string[] }],
    },
    {
      name: "活動なし商談レポート",
      objectType: "deal",
      columns: ["dealName", "stage", "amount", "lastActivityAt", "company.companyName", "owner.name"],
      description: "30日以上活動がない商談の一覧",
      sortField: "lastActivityAt",
      sortDir: "asc",
      filters: [{ field: "lastActivityAt", operator: "lt", value: "30d" }],
    },
    {
      name: "担当者別フォローアップ漏れ",
      objectType: "activity",
      columns: ["subject", "nextActionDueDate", "owner.name", "company.companyName"],
      description: "期限切れのフォローアップ活動",
      sortField: "nextActionDueDate",
      sortDir: "asc",
      filters: [{ field: "nextActionDueDate", operator: "lt", value: "today" }],
    },
  ];

  const createdReports = await Promise.all(
    reportDefs.map((r) =>
      prisma.report.create({
        data: {
          name: r.name,
          description: r.description,
          objectType: r.objectType,
          columns: r.columns,
          filters: r.filters as object[],
          sortField: r.sortField ?? null,
          sortDir: r.sortDir,
          groupBy: (r as { groupBy?: string }).groupBy ?? null,
          isPublic: true,
          createdById: adminUser.id,
        },
      })
    )
  );

  const [dealPipelineReport, stageSummaryReport, companyListReport, activityTimelineReport, taskListReport, funnelReport, activitySummaryReport, dealByRepReport, staleDealsReport, followupReport] = createdReports;

  console.log(`✅ ${createdReports.length}件のレポートを作成`);

  // ===================== Dashboards (2) =====================
  // Layout uses 12-col grid. Each widget has position: {x,y,w,h}
  // Row height = 80px.  KPI rows h=2 (160px), chart rows h=4 (320px).
  console.log("📈 ダッシュボードを作成中...");

  const salesDashboard = await prisma.dashboard.create({
    data: {
      name: "営業ダッシュボード",
      description: "営業チームの主要KPIと商談状況を一目で把握",
      visibility: "PUBLIC",
      defaultDateRange: "thisMonth",
      ownerId: adminUser.id,
    },
  });

  const activityDashboard = await prisma.dashboard.create({
    data: {
      name: "営業活動分析ダッシュボード",
      description: "担当者別の活動量・商談進捗を分析",
      visibility: "PUBLIC",
      defaultDateRange: "last30",
      ownerId: adminUser.id,
    },
  });

  // ── 営業ダッシュボード Widgets ──────────────────────────────────────────────
  // Row 0 (y=0, h=2): 4 KPI cards @ w=3 each → fills 12 cols
  // Row 1 (y=2, h=4): Stage BAR (w=6) | Funnel (w=6)
  // Row 2 (y=6, h=4): Rep RANKING (w=4) | Monthly LINE (w=8)
  // Row 3 (y=10, h=4): Stale RISK_LIST (w=6) | Pipeline TABLE (w=6)
  await Promise.all([
    // ── Row 0: KPI strip ─────────────────────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealPipelineReport.id,
        title: "進行中商談数", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 0,
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealPipelineReport.id,
        title: "パイプライン金額", widgetType: "KPI",
        config: { metric: "sumAmount", format: "currency" },
        size: "SMALL", sortOrder: 1,
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealPipelineReport.id,
        title: "加重パイプライン", widgetType: "KPI",
        config: { metric: "weightedAmount", format: "currency" },
        size: "SMALL", sortOrder: 2,
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: staleDealsReport.id,
        title: "活動なし商談（30日超）", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 3,
        position: { x: 9, y: 0, w: 3, h: 2 },
      },
    }),
    // ── Row 1: Stage breakdown + Funnel ─────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: stageSummaryReport.id,
        title: "ステージ別商談金額", widgetType: "BAR",
        config: { orientation: "horizontal", yAxis: "amount" },
        size: "LARGE", sortOrder: 4,
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: funnelReport.id,
        title: "商談ファネル", widgetType: "FUNNEL",
        config: { metric: "amount" },
        size: "LARGE", sortOrder: 5,
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
    }),
    // ── Row 2: Rep ranking + Monthly trend ──────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealByRepReport.id,
        title: "担当者別パイプライン", widgetType: "RANKING",
        config: { metric: "amount", limit: 5 },
        size: "MEDIUM", sortOrder: 6,
        position: { x: 0, y: 6, w: 4, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealPipelineReport.id,
        title: "商談金額推移", widgetType: "LINE",
        config: { metric: "amount", dateGroup: "month" },
        size: "WIDE", sortOrder: 7,
        position: { x: 4, y: 6, w: 8, h: 4 },
      },
    }),
    // ── Row 3: Risk list + Pipeline table ────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: staleDealsReport.id,
        title: "要対応：活動なし商談", widgetType: "RISK_LIST",
        config: { limit: 6 },
        size: "LARGE", sortOrder: 8,
        position: { x: 0, y: 10, w: 6, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: salesDashboard.id, reportId: dealPipelineReport.id,
        title: "今月クローズ予定商談", widgetType: "TABLE",
        config: { limit: 5 },
        size: "LARGE", sortOrder: 9,
        position: { x: 6, y: 10, w: 6, h: 4 },
      },
    }),
  ]);

  // ── 営業活動分析ダッシュボード Widgets ─────────────────────────────────────
  // Row 0 (y=0, h=2): 4 KPI cards
  // Row 1 (y=2, h=4): Activity by rep BAR (w=6) | Activity type DONUT (w=6)
  // Row 2 (y=6, h=4): Monthly LINE (w=8) | Activity count KPI (w=4)
  // Row 3 (y=10, h=4): Followup RISK_LIST (w=6) | Rep RANKING (w=6)
  await Promise.all([
    // ── Row 0: KPI strip ─────────────────────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activityTimelineReport.id,
        title: "今月の活動件数", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 0,
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: followupReport.id,
        title: "フォローアップ期限超過", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 1,
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: staleDealsReport.id,
        title: "活動なし商談", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 2,
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: taskListReport.id,
        title: "未完了タスク", widgetType: "KPI",
        config: { metric: "count", format: "number" },
        size: "SMALL", sortOrder: 3,
        position: { x: 9, y: 0, w: 3, h: 2 },
      },
    }),
    // ── Row 1: Activity breakdown charts ────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activitySummaryReport.id,
        title: "担当者別活動件数", widgetType: "BAR",
        config: { orientation: "horizontal", yAxis: "count" },
        size: "LARGE", sortOrder: 4,
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activityTimelineReport.id,
        title: "活動種別の比率", widgetType: "DONUT",
        config: { xAxis: "type" },
        size: "LARGE", sortOrder: 5,
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
    }),
    // ── Row 2: Monthly trend + Rep ranking ──────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activityTimelineReport.id,
        title: "月次活動推移", widgetType: "LINE",
        config: { metric: "count", dateGroup: "month" },
        size: "WIDE", sortOrder: 6,
        position: { x: 0, y: 6, w: 8, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activitySummaryReport.id,
        title: "担当者ランキング", widgetType: "RANKING",
        config: { metric: "count", limit: 5 },
        size: "MEDIUM", sortOrder: 7,
        position: { x: 8, y: 6, w: 4, h: 4 },
      },
    }),
    // ── Row 3: Risk lists ─────────────────────────────────────────────────────
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: followupReport.id,
        title: "要対応：フォローアップ期限切れ", widgetType: "RISK_LIST",
        config: { limit: 6 },
        size: "LARGE", sortOrder: 8,
        position: { x: 0, y: 10, w: 6, h: 4 },
      },
    }),
    prisma.dashboardWidget.create({
      data: {
        dashboardId: activityDashboard.id, reportId: activityTimelineReport.id,
        title: "直近の活動（上位5件）", widgetType: "TABLE",
        config: { limit: 5 },
        size: "LARGE", sortOrder: 9,
        position: { x: 6, y: 10, w: 6, h: 4 },
      },
    }),
  ]);

  console.log("✅ 2つのダッシュボードを作成（KPI中心・グリッド位置付き）");

  // ===================== MA Seed (minimal — keep existing structure) =====================
  const prospects = await Promise.all([
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
  ].map((p) => prisma.prospect.create({ data: { ...p, status: "active", lastActivityAt: new Date() } })));

  const [listAll, listHot] = await Promise.all([
    prisma.marketingList.create({ data: { name: "全プロスペクト", description: "全ての有効なプロスペクト", type: "static", createdById: adminUser.id } }),
    prisma.marketingList.create({ data: { name: "ホットリード", description: "スコア70以上", type: "static", createdById: adminUser.id } }),
    prisma.marketingList.create({ data: { name: "新規リード（Web流入）", description: "Web経由の新規リード", type: "static", createdById: adminUser.id } }),
  ]);

  await Promise.all([
    ...prospects.map((p) => prisma.marketingListMembership.create({ data: { listId: listAll.id, prospectId: p.id, addedBy: "import" } })),
    ...prospects.filter((p) => p.score >= 70).map((p) => prisma.marketingListMembership.create({ data: { listId: listHot.id, prospectId: p.id, addedBy: "automation" } })),
  ]);

  const template = await prisma.emailTemplate.create({
    data: {
      name: "製品紹介テンプレート",
      subject: "【{{company}}様へ】弊社ソリューションのご紹介",
      previewText: "貴社の課題解決をサポートします",
      fromName: "営業チーム",
      fromEmail: "sales@example.com",
      bodyHtml: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#0176d3;">{{first_name}}様</h2><p>平素よりお世話になっております。</p><p>{{company}}様の課題解決に向けて、弊社ソリューションをご提案させていただきたいと存じます。</p><p style="margin-top:20px;"><a href="#" style="background:#0176d3;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;">詳細を見る</a></p><p style="margin-top:30px;font-size:12px;color:#999;">配信停止をご希望の方は<a href="{{unsubscribe_url}}">こちら</a></p></body></html>`,
      type: "regular",
      createdById: adminUser.id,
    },
  });

  const email1 = await prisma.marketingEmail.create({
    data: {
      name: "2026年 春のキャンペーン",
      subject: "春の特別オファーをお届けします",
      fromName: "マーケティングチーム",
      fromEmail: "marketing@example.com",
      templateId: template.id,
      listId: listAll.id,
      bodyHtml: template.bodyHtml,
      status: "sent",
      sentAt: daysAgo(7),
      totalSent: 10,
      totalOpened: 6,
      totalClicked: 2,
      createdById: adminUser.id,
    },
  });
  void email1;

  const form = await prisma.marketingForm.create({
    data: {
      name: "資料請求フォーム",
      description: "製品資料の請求に利用するフォームです",
      fields: [
        { id: "f1", type: "email", label: "メールアドレス", name: "email", required: true },
        { id: "f2", type: "text", label: "名前", name: "name", required: true },
        { id: "f3", type: "text", label: "会社名", name: "company", required: false },
      ] as object[],
      thankYouMsg: "資料請求を受け付けました。2営業日以内にご連絡いたします。",
      isActive: true,
      createdById: adminUser.id,
    },
  });

  await prisma.landingPage.create({
    data: {
      name: "製品紹介LP",
      title: "業務効率を劇的に改善するCRMソリューション",
      slug: "product-overview",
      description: "製品の主要機能と導入メリットを紹介するページ",
      bodyHtml: "<div><h1>業務効率を劇的に改善するCRM</h1></div>",
      status: "published",
      publishedAt: new Date(),
      views: 342,
      createdById: adminUser.id,
    },
  });

  await Promise.all([
    prisma.scoringRule.create({ data: { name: "メール開封", category: "behavior", triggerType: "email_open", scoreChange: 5, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "メールクリック", category: "behavior", triggerType: "email_click", scoreChange: 10, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "フォーム送信", category: "behavior", triggerType: "form_submit", scoreChange: 25, isActive: true } }),
    prisma.scoringRule.create({ data: { name: "価格ページ閲覧", category: "behavior", triggerType: "page_view_pricing", scoreChange: 15, isActive: true } }),
  ]);

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
  ]);

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

  const program = await prisma.engagementProgram.create({
    data: { name: "新規リードナーチャリング", description: "新規リード向け3ステップナーチャリング", status: "active", createdById: adminUser.id },
  });
  await Promise.all([
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "email", label: "ウェルカムメール送信", config: { delay: 0 } as object, positionX: 100, positionY: 50 } }),
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "wait", label: "3日待機", config: { days: 3 } as object, positionX: 100, positionY: 150 } }),
    prisma.engagementProgramNode.create({ data: { programId: program.id, type: "email", label: "製品紹介メール送信", config: { delay: 3 } as object, positionX: 100, positionY: 250 } }),
  ]);

  // ===================== Leads (120) =====================
  const leadStatuses = ["NEW", "WORKING", "NURTURING", "CONVERTED", "DISQUALIFIED"];
  const leadRatings = ["HOT", "WARM", "COLD"];
  const leadSources = ["Web", "Email", "Phone", "Event", "Partner", "Referral", "SNS"];
  const leadIndustries = ["IT", "製造", "金融", "小売", "医療", "教育", "不動産", "物流", "サービス", "建設"];
  const leadFirstNames = ["太郎", "花子", "一郎", "愛", "健太", "さくら", "翔", "美咲", "大輔", "由美"];
  const leadLastNames = ["田中", "鈴木", "佐藤", "高橋", "山本", "伊藤", "渡辺", "加藤", "吉田", "山田", "中村", "小林"];

  const seedLeads = [];
  for (let i = 0; i < 120; i++) {
    const fn = leadFirstNames[i % leadFirstNames.length];
    const ln = leadLastNames[i % leadLastNames.length];
    seedLeads.push(
      prisma.lead.create({
        data: {
          firstName: fn,
          lastName: ln,
          fullName: `${ln} ${fn}`,
          email: `lead${i + 1}@example${(i % 10) + 1}.com`,
          phone: `03-${String(i + 1000).padStart(4, "0")}-${String((i * 7) % 9999).padStart(4, "0")}`,
          companyName: `株式会社サンプル${i + 1}`,
          title: ["部長", "課長", "主任", "担当", "マネージャー", "ディレクター"][i % 6],
          industry: leadIndustries[i % leadIndustries.length],
          source: leadSources[i % leadSources.length],
          status: leadStatuses[i % leadStatuses.length],
          rating: leadRatings[i % leadRatings.length],
          score: randomBetween(0, 100),
          ownerId: adminUser.id,
        },
      })
    );
  }
  await Promise.all(seedLeads);

  // ===================== Campaigns (20) =====================
  const campaignTypes = ["Email", "Event", "Webinar", "Content", "SNS", "Paid"];
  const campaignStatuses = ["Planning", "Active", "Completed", "Aborted"];
  const seedCampaigns = [];
  for (let i = 0; i < 20; i++) {
    const startDate = new Date(2026, i % 12, 1);
    const endDate = new Date(2026, i % 12, 28);
    seedCampaigns.push(
      prisma.campaign.create({
        data: {
          name: `${["春の大商談フェア", "製品ローンチキャンペーン", "ウェビナーシリーズ", "パートナー紹介プログラム", "SNSキャンペーン"][i % 5]} 2026Q${(i % 4) + 1}`,
          type: campaignTypes[i % campaignTypes.length],
          status: campaignStatuses[i % campaignStatuses.length],
          description: `${campaignTypes[i % campaignTypes.length]}を活用した見込み客獲得施策`,
          startDate,
          endDate,
          budget: (i + 1) * 500_000,
          actualCost: i < 10 ? (i + 1) * 350_000 : null,
          isActive: i % campaignStatuses.length === 1,
          ownerId: adminUser.id,
        },
      })
    );
  }
  await Promise.all(seedCampaigns);

  // ===================== Products (30) + PriceBooks =====================
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

  const standardPB = await prisma.priceBook.create({ data: { name: "標準価格表", isStandard: true, isActive: true } });
  const premiumPB = await prisma.priceBook.create({ data: { name: "プレミアム価格表", isStandard: false, isActive: true } });

  for (let i = 0; i < createdProducts.length; i++) {
    await prisma.priceBookEntry.create({ data: { priceBookId: standardPB.id, productId: createdProducts[i].id, unitPrice: (i + 1) * 50_000, isActive: i < 25 } });
    if (i < 15) {
      await prisma.priceBookEntry.create({ data: { priceBookId: premiumPB.id, productId: createdProducts[i].id, unitPrice: (i + 1) * 70_000, isActive: true } });
    }
  }
  void premiumPB;

  // ===================== Account 360 Data =====================
  console.log("🏢 Account 360 データを更新中...");

  const account360Industries = ["製造業", "IT・ソフトウェア", "金融・保険", "商社・流通", "不動産", "医療・ヘルスケア", "教育", "小売・EC", "建設", "コンサルティング"];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    await prisma.company.update({
      where: { id: company.id },
      data: {
        businessSummary: `${company.companyName}は${account360Industries[i % account360Industries.length]}業界のリーディングカンパニーです。`,
      },
    });
  }

  // AccountTeamMember
  const teamRoles = ["OWNER", "ACCOUNT_MANAGER", "CSM", "SALES_REP", "EXECUTIVE_SPONSOR"];
  const allSalesAndManagers = [sales1, sales2, sales3, sales4, sales5, sales6, manager1, manager2];
  for (let i = 0; i < Math.min(companies.length, 40); i++) {
    const company = companies[i];
    const numMembers = randomBetween(1, 3);
    const chosen = pickN(allSalesAndManagers, numMembers);
    for (let j = 0; j < chosen.length; j++) {
      await prisma.accountTeamMember.upsert({
        where: { companyId_userId: { companyId: company.id, userId: chosen[j].id } },
        create: { companyId: company.id, userId: chosen[j].id, role: teamRoles[j % teamRoles.length], isPrimary: j === 0 },
        update: {},
      });
    }
  }

  // AccountInsight
  const insightTemplates = [
    { type: "RISK", title: "30日以上活動がありません", body: "最後の活動から30日以上が経過しています。早急にコンタクトを取ることをお勧めします。", severity: "HIGH", source: "SYSTEM", actionLabel: "活動を記録", actionUrl: "/activities/new" },
    { type: "OPPORTUNITY", title: "高スコアリードが存在します", body: "スコア70以上のリードが複数あります。商談に転換するチャンスです。", severity: "MEDIUM", source: "MA", actionLabel: null, actionUrl: null },
    { type: "RENEWAL", title: "契約更新予定日が近づいています", body: "契約の更新期限まで60日を切っています。更新提案の準備を開始してください。", severity: "HIGH", source: "CRM", actionLabel: "契約を確認", actionUrl: null },
    { type: "SUPPORT", title: "未解決のケースがあります", body: "優先度「高」以上の未解決ケースが存在します。サポートチームと連携してください。", severity: "MEDIUM", source: "CRM", actionLabel: null, actionUrl: null },
    { type: "ENGAGEMENT", title: "キャンペーン反応後に商談化していません", body: "最近のキャンペーンに反応しましたが、商談が作成されていません。", severity: "LOW", source: "MA", actionLabel: "商談を作成", actionUrl: null },
  ];

  for (let i = 0; i < Math.min(companies.length, 30); i++) {
    const company = companies[i];
    const count = randomBetween(1, 3);
    for (let j = 0; j < count; j++) {
      const template = insightTemplates[(i + j) % insightTemplates.length];
      await prisma.accountInsight.create({
        data: {
          companyId: company.id,
          type: template.type,
          title: template.title,
          body: template.body,
          severity: template.severity,
          source: template.source,
          actionLabel: template.actionLabel,
          actionUrl: template.actionUrl,
          isDismissed: false,
        },
      });
    }
  }

  // AccountHealthSnapshot
  for (const company of companies.slice(0, 40)) {
    const baseScore = randomBetween(35, 85);
    for (let month = 0; month < 6; month++) {
      const score = Math.min(100, Math.max(0, baseScore + randomBetween(-10, 10)));
      const measuredAt = new Date("2026-05-16");
      measuredAt.setMonth(measuredAt.getMonth() - month);
      await prisma.accountHealthSnapshot.create({
        data: {
          companyId: company.id,
          healthScore: score,
          fitScore: randomBetween(60, 100),
          engagementScore: randomBetween(20, 80),
          riskLevel: score >= 70 ? "LOW" : score >= 50 ? "MEDIUM" : score >= 30 ? "HIGH" : "CRITICAL",
          reason: { factors: ["activity_score", "deal_velocity", "support_satisfaction"] },
          measuredAt,
        },
      });
    }
    await prisma.company.update({ where: { id: company.id }, data: { healthScore: baseScore } });
  }

  // AccountPlan
  for (const company of companies.slice(0, 15)) {
    await prisma.accountPlan.create({
      data: {
        companyId: company.id,
        name: "2026年度 アカウントプラン",
        fiscalYear: "2026",
        status: "ACTIVE",
        summary: `${company.companyName}との関係強化と収益拡大を目指す年度計画です。`,
        businessObjectives: ["ARR20%向上", "プロダクト導入範囲拡大", "C-Level関係の強化"],
        keyInitiatives: ["四半期レビュー実施", "エグゼクティブスポンサー設定", "カスタマーサクセス強化"],
        risks: ["競合他社の提案", "予算削減リスク", "担当者変更"],
        expansionOpportunities: ["追加モジュール導入", "部門展開", "グループ展開"],
        nextActions: ["来月のQBR設定", "CSMとのキックオフ", "更新提案書作成"],
        ownerId: null,
      },
    });
  }

  // AccountRelationship
  if (companies.length >= 3) {
    await prisma.accountRelationship.createMany({
      data: [
        { sourceCompanyId: companies[0].id, targetCompanyId: companies[1].id, relationshipType: "SUBSIDIARY", description: "子会社" },
        { sourceCompanyId: companies[0].id, targetCompanyId: companies[2].id, relationshipType: "PARTNER", description: "パートナー企業" },
        { sourceCompanyId: companies[3].id, targetCompanyId: companies[4].id, relationshipType: "COMPETITOR", description: "競合企業" },
      ],
      skipDuplicates: true,
    });
  }

  // RecordPageDefinition
  const companyPage = await prisma.recordPageDefinition.upsert({
    where: { objectApiName_apiName: { objectApiName: "Company", apiName: "company_360_default" } },
    create: {
      objectApiName: "Company",
      apiName: "company_360_default",
      label: "取引先360",
      description: "取引先の全情報を一画面で確認できる標準ページ",
      pageType: "RECORD_PAGE",
      template: "TABS_WITH_RIGHT_SIDEBAR",
      status: "ACTIVE",
      isDefault: true,
      layout: {},
    },
    update: {},
  });

  const defaultComponents = [
    { componentType: "RECORD_HEADER", region: "header", sortOrder: 0, config: {} },
    { componentType: "HIGHLIGHT_PANEL", region: "header", sortOrder: 1, config: {} },
    { componentType: "FIELD_SECTION", region: "tab:overview", sortOrder: 0, config: { title: "企業概要", columns: 2 } },
    { componentType: "RELATED_LIST", region: "tab:overview", sortOrder: 1, config: { title: "進行中商談", relatedObject: "deals", maxRows: 5 } },
    { componentType: "RELATED_LIST", region: "tab:overview", sortOrder: 2, config: { title: "担当者", relatedObject: "contacts", maxRows: 5 } },
    { componentType: "FIELD_SECTION", region: "tab:details", sortOrder: 0, config: { title: "基本情報", columns: 2 } },
    { componentType: "RELATED_LIST", region: "tab:related", sortOrder: 0, config: { title: "担当者", relatedObject: "contacts", maxRows: 10 } },
    { componentType: "RELATED_LIST", region: "tab:related", sortOrder: 1, config: { title: "商談", relatedObject: "deals", maxRows: 10 } },
    { componentType: "RELATED_LIST", region: "tab:related", sortOrder: 2, config: { title: "ケース", relatedObject: "cases", maxRows: 10 } },
    { componentType: "ACTIVITY_TIMELINE", region: "tab:activity", sortOrder: 0, config: {} },
    { componentType: "ACCOUNT_HEALTH", region: "sidebar", sortOrder: 0, config: {} },
    { componentType: "ACCOUNT_TEAM", region: "sidebar", sortOrder: 1, config: {} },
    { componentType: "TASK_LIST", region: "sidebar", sortOrder: 2, config: { title: "次のタスク", maxRows: 3 } },
    { componentType: "INSIGHT_CARD", region: "sidebar", sortOrder: 3, config: {} },
  ];

  for (const comp of defaultComponents) {
    await prisma.pageComponentInstance.create({ data: { recordPageId: companyPage.id, ...comp } });
  }

  await prisma.recordPageAssignment.create({
    data: { recordPageId: companyPage.id, objectApiName: "Company", formFactor: "BOTH", priority: 0, isActive: true },
  });

  // ===================== ObjectDefinitions =====================
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
      update: { label: obj.label, pluralLabel: obj.pluralLabel, category: obj.category, description: obj.description, objectType: "STANDARD", isActive: true, isSearchable: true, isReportable: true, isAuditable: true, enableActivities: obj.enableActivities, enableNotes: obj.enableNotes, enableFiles: obj.enableFiles, enableHistory: obj.enableHistory },
      create: { apiName: obj.apiName, label: obj.label, pluralLabel: obj.pluralLabel, category: obj.category, description: obj.description, objectType: "STANDARD", isActive: true, isSearchable: true, isReportable: true, isAuditable: true, enableActivities: obj.enableActivities, enableNotes: obj.enableNotes, enableFiles: obj.enableFiles, enableHistory: obj.enableHistory, createdById: adminUser.id },
    });
  }

  const leadObjDef = await prisma.objectDefinition.findUnique({ where: { apiName: "Lead" } });
  if (leadObjDef) {
    const leadFields = [
      { apiName: "fullName", label: "氏名", fieldType: "TEXT", isRequired: true, sortOrder: 1 },
      { apiName: "email", label: "メール", fieldType: "EMAIL", isRequired: false, sortOrder: 2 },
      { apiName: "companyName", label: "会社名", fieldType: "TEXT", isRequired: false, sortOrder: 3 },
      { apiName: "title", label: "役職", fieldType: "TEXT", isRequired: false, sortOrder: 4 },
      { apiName: "phone", label: "電話番号", fieldType: "PHONE", isRequired: false, sortOrder: 5 },
      { apiName: "status", label: "ステータス", fieldType: "PICKLIST", isRequired: true, sortOrder: 6, options: { values: ["NEW", "WORKING", "NURTURING", "CONVERTED", "DISQUALIFIED"] } },
      { apiName: "rating", label: "評価", fieldType: "PICKLIST", isRequired: false, sortOrder: 7, options: { values: ["HOT", "WARM", "COLD"] } },
      { apiName: "score", label: "スコア", fieldType: "NUMBER", isRequired: false, sortOrder: 8 },
      { apiName: "source", label: "参照元", fieldType: "TEXT", isRequired: false, sortOrder: 9 },
      { apiName: "ownerId", label: "所有者", fieldType: "LOOKUP", isRequired: false, sortOrder: 10 },
    ];

    for (const field of leadFields) {
      await prisma.fieldDefinition.upsert({
        where: { objectDefinitionId_apiName: { objectDefinitionId: leadObjDef.id, apiName: field.apiName } },
        update: { label: field.label, fieldType: field.fieldType, isRequired: field.isRequired, isSystem: true, sortOrder: field.sortOrder, options: (field as { options?: object }).options ?? undefined },
        create: { objectDefinitionId: leadObjDef.id, apiName: field.apiName, label: field.label, fieldType: field.fieldType, isRequired: field.isRequired, isSystem: true, sortOrder: field.sortOrder, options: (field as { options?: object }).options ?? undefined },
      });
    }
  }

  // ===================== Final Summary =====================
  const [
    totalUsers,
    totalCompanies,
    totalContacts,
    totalDeals,
    totalActivities,
    totalTasks,
    totalCases,
    totalReports,
    totalDashboards,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.activity.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.report.count(),
    prisma.dashboard.count(),
  ]);

  console.log("\n✅ シードデータの投入が完了しました！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`👤 ユーザー: ${totalUsers}`);
  console.log(`🏢 企業: ${totalCompanies}`);
  console.log(`👥 コンタクト: ${totalContacts}`);
  console.log(`💼 商談: ${totalDeals}`);
  console.log(`📋 活動: ${totalActivities}`);
  console.log(`✅ タスク: ${totalTasks}`);
  console.log(`📁 ケース: ${totalCases}`);
  console.log(`📊 レポート: ${totalReports}`);
  console.log(`📈 ダッシュボード: ${totalDashboards}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
