// Standard object route mapping for Object Manager
export const STANDARD_OBJECT_ROUTES: Record<string, {
  list?: string;
  detail?: (id: string) => string;
  maList?: string;
  maDetail?: (id: string) => string;
}> = {
  Account: { list: "/companies", detail: (id) => `/companies/${id}` },
  Contact: { list: "/contacts", detail: (id) => `/contacts/${id}` },
  Lead: {
    list: "/leads",
    detail: (id) => `/leads/${id}`,
    maList: "/ma/leads",
    maDetail: (id) => `/ma/leads/${id}`,
  },
  Deal: { list: "/deals", detail: (id) => `/deals/${id}` },
  Opportunity: { list: "/deals", detail: (id) => `/deals/${id}` },
  Campaign: { list: "/campaigns", detail: (id) => `/campaigns/${id}` },
  Case: { list: "/cases", detail: (id) => `/cases/${id}` },
  Product: { list: "/products", detail: (id) => `/products/${id}` },
  Task: { list: "/tasks", detail: (id) => `/tasks/${id}` },
  Activity: { list: "/activities" },
  PriceBook: { list: "/price-books" },
  Quote: { list: "/quotes" },
  Contract: { list: "/contracts" },
  Order: { list: "/orders" },
  MarketingEmail: { list: "/ma/emails" },
  MarketingForm: { list: "/ma/forms" },
  LandingPage: { list: "/ma/landing-pages" },
  EngagementProgram: { list: "/ma/engagement-programs" },
};

// Map standard apiNames to Prisma model count queries
export const STANDARD_OBJECT_PRISMA_MODEL: Record<string, string> = {
  Account: "company",
  Contact: "contact",
  Lead: "lead",
  Deal: "deal",
  Opportunity: "deal",
  Campaign: "campaign",
  Case: "case",
  Product: "product",
  Task: "task",
  Activity: "activity",
  MarketingEmail: "marketingEmail",
  MarketingForm: "marketingForm",
  EngagementProgram: "engagementProgram",
};

export function getStandardObjectRoute(apiName: string) {
  return STANDARD_OBJECT_ROUTES[apiName] ?? null;
}

export function isStandardObject(objectType: string) {
  return objectType === "STANDARD";
}
