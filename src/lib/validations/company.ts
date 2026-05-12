import { z } from "zod";

export const companySchema = z.object({
  companyName: z.string().min(1, "会社名は必須です"),
  website: z.string().url("URLの形式が正しくありません").optional().or(z.literal("")),
  industry: z.string().optional(),
  employeeSize: z.string().optional(),
  status: z.enum(["prospect", "negotiating", "active", "lost", "dormant"]),
  ownerName: z.string().optional(),
  memo: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
