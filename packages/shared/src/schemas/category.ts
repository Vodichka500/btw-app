import { z } from "zod";
import { CategorySchema, type Category } from "@btw-app/db/zod";

export const CreateCategoryInputSchema = CategorySchema.pick({
  name: true,
  parentId: true,
  order: true,
}).partial({
  parentId: true,
  order: true,
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

export const UpdateCategoryInputSchema = CategorySchema.pick({
  id: true,
  name: true,
  parentId: true,
  order: true,
}).partial({
  name: true,
  parentId: true,
  order: true,
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

export const ChangeOrderCategoryInputSchema = z.object({
  id: z.number().int(),
  parentId: z.number().int().nullable(),
  order: z.number().int(),
});
export type ChangeOrderCategoryInput = z.infer<
  typeof ChangeOrderCategoryInputSchema
>;

export type CategoryNode = Category & {
  children: CategoryNode[];
};
