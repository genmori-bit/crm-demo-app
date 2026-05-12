import { z } from "zod";

export const activitySchema = z.object({
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  type: z.enum(["phone", "email", "meeting", "note", "other"]),
  subject: z.string().min(1, "件名は必須です"),
  body: z.string().optional(),
  activityDate: z.string().min(1, "活動日は必須です"),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
