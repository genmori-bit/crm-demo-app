import { z } from "zod";

export const taskSchema = z.object({
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "done"]),
});

export type TaskFormData = z.infer<typeof taskSchema>;
