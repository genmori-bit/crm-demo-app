import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "company" | "contact" | "deal";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const [companies, contacts, deals] = await Promise.all([
    prisma.company.findMany({
      where: {
        deletedAt: null,
        companyName: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, companyName: true, industry: true, status: true },
    }),
    prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, fullName: true, title: true, company: { select: { companyName: true } } },
    }),
    prisma.deal.findMany({
      where: {
        deletedAt: null,
        dealName: { contains: query, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, dealName: true, stage: true, company: { select: { companyName: true } } },
    }),
  ]);

  const results: SearchResult[] = [
    ...companies.map((c) => ({
      type: "company" as const,
      id: c.id,
      title: c.companyName,
      subtitle: c.industry ?? c.status,
      href: `/companies/${c.id}`,
    })),
    ...contacts.map((c) => ({
      type: "contact" as const,
      id: c.id,
      title: c.fullName,
      subtitle: c.company.companyName,
      href: `/contacts/${c.id}`,
    })),
    ...deals.map((d) => ({
      type: "deal" as const,
      id: d.id,
      title: d.dealName,
      subtitle: d.company.companyName,
      href: `/deals/${d.id}`,
    })),
  ];

  return results;
}
