import { z } from "zod";
import { UserSchema, RoleSchema } from "@btw-app/db/zod";

export const UpdateProfileSchema = z.object({
  tgChatId: z.string().nullable().optional(),
  alfaEmail: z.string().nullable().optional(),
  alfaToken: z.string().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const CreateUserSchema = UserSchema.pick({
  email: true,
  name: true,
  role: true,
  tgChatId: true,
}).extend({
  email: z.string().email({ message: "Niepoprawny format email" }),
  name: z.string().min(2, { message: "Imię jest wymagane" }),
  role: RoleSchema,
  password: z.string().min(6, { message: "Hasło musi mieć min. 6 znaków" }),
  teacherId: z.number().int().nullable().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;



export const AdminUpdateUserSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  role: true,
  tgChatId: true,
}).extend({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  role: RoleSchema,
  teacherId: z.number().int().nullable().optional(),
});
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

export const DeleteUserSchema = UserSchema.pick({
  id: true,
}).extend({
  id: z.string(),
});
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;

export type User = z.infer<typeof UserSchema>;
