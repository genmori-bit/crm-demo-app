import { z } from "zod";

export const contactSchema = z.object({
  companyId: z.string().min(1, "会社は必須です"),
  fullName: z.string().min(1, "氏名は必須です"),
  email: z.string().email("メールアドレスの形式が正しくありません").optional().or(z.literal("")),
  phone: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().default(false),
  memo: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
