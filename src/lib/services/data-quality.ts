import { prisma } from "@/lib/prisma";

export type DataQualityIssue = {
  id: string;
  objectType: string;
  objectId: string;
  objectName: string;
  issueType: string;
  field?: string;
  href: string;
};

export async function getDataQualityIssues(): Promise<{
  issues: DataQualityIssue[];
  summary: Record<string, number>;
}> {
  const issues: DataQualityIssue[] = [];

  const [companies, contacts, deals] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, website: true, industry: true, phone: true },
    }),
    prisma.contact.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true, email: true, phone: true, title: true },
    }),
    prisma.deal.findMany({
      where: { deletedAt: null },
      select: { id: true, dealName: true, expectedCloseDate: true, stage: true, amount: true, nextAction: true },
    }),
  ]);

  for (const c of companies) {
    if (!c.industry) issues.push({ id: `co-industry-${c.id}`, objectType: "company", objectId: c.id, objectName: c.companyName, issueType: "missing_field", field: "industry", href: `/companies/${c.id}` });
    if (!c.phone) issues.push({ id: `co-phone-${c.id}`, objectType: "company", objectId: c.id, objectName: c.companyName, issueType: "missing_field", field: "phone", href: `/companies/${c.id}` });
  }

  for (const c of contacts) {
    if (!c.email) issues.push({ id: `ct-email-${c.id}`, objectType: "contact", objectId: c.id, objectName: c.fullName, issueType: "missing_field", field: "email", href: `/contacts/${c.id}` });
    if (!c.phone && !c.email) issues.push({ id: `ct-contact-${c.id}`, objectType: "contact", objectId: c.id, objectName: c.fullName, issueType: "no_contact_info", href: `/contacts/${c.id}` });
  }

  for (const d of deals) {
    if (!d.expectedCloseDate) issues.push({ id: `dl-close-${d.id}`, objectType: "deal", objectId: d.id, objectName: d.dealName, issueType: "missing_field", field: "expectedCloseDate", href: `/deals/${d.id}` });
    if (d.amount === 0) issues.push({ id: `dl-amount-${d.id}`, objectType: "deal", objectId: d.id, objectName: d.dealName, issueType: "zero_amount", href: `/deals/${d.id}` });
    if (!d.nextAction && d.stage !== "won" && d.stage !== "lost") {
      issues.push({ id: `dl-action-${d.id}`, objectType: "deal", objectId: d.id, objectName: d.dealName, issueType: "missing_next_action", href: `/deals/${d.id}` });
    }
  }

  const summary = issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.issueType] = (acc[i.issueType] ?? 0) + 1;
    return acc;
  }, {});

  return { issues, summary };
}

export async function getDuplicateCandidates() {
  const [companies, contacts] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, website: true },
    }),
    prisma.contact.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true, email: true, companyId: true, company: { select: { companyName: true } } },
    }),
  ]);

  type DuplicateGroup = { type: string; reason: string; items: { id: string; name: string; href: string }[] };
  const groups: DuplicateGroup[] = [];

  // Company duplicates by normalized name
  const companyMap = new Map<string, typeof companies>();
  for (const c of companies) {
    const key = c.companyName.toLowerCase().replace(/[株式会社|有限会社|\s]/g, "");
    if (!companyMap.has(key)) companyMap.set(key, []);
    companyMap.get(key)!.push(c);
  }
  for (const [, group] of companyMap) {
    if (group.length > 1) {
      groups.push({
        type: "company",
        reason: "会社名が類似",
        items: group.map((c) => ({ id: c.id, name: c.companyName, href: `/companies/${c.id}` })),
      });
    }
  }

  // Contact duplicates by email
  const emailMap = new Map<string, typeof contacts>();
  for (const c of contacts) {
    if (!c.email) continue;
    const key = c.email.toLowerCase();
    if (!emailMap.has(key)) emailMap.set(key, []);
    emailMap.get(key)!.push(c);
  }
  for (const [, group] of emailMap) {
    if (group.length > 1) {
      groups.push({
        type: "contact",
        reason: "メールアドレスが重複",
        items: group.map((c) => ({ id: c.id, name: c.fullName, href: `/contacts/${c.id}` })),
      });
    }
  }

  return groups;
}
