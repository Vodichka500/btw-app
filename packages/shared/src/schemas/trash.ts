import { z } from "zod";

export const RecycleBinItemTypeSchema = z.enum(["category", "snippet"]);
export type RecycleBinItemType = z.infer<typeof RecycleBinItemTypeSchema>;

export const TrashItemInputSchema = z.object({
  type: RecycleBinItemTypeSchema,
  id: z.number().int(),
});

export type TrashItemInput = z.infer<typeof TrashItemInputSchema>;
