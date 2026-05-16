import { z } from "zod";

export const dealSchema = z.object({
  companyId: z.string().min(1, "会社は必須です"),
  contactId: z.string().optional(),
  dealName: z.string().min(1, "商談名は必須です"),
  stage: z.enum(["qualification", "needs_analysis", "value_proposition", "proposal", "negotiation", "final_review", "won", "lost"]),
  amount: z.coerce.number().min(0, "金額は0以上で入力してください"),
  probability: z.coerce.number().min(0, "確度は0以上で入力してください").max(100, "確度は100以下で入力してください"),
  expectedCloseDate: z.string().optional(),
  nextAction: z.string().optional(),
  memo: z.string().optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;
