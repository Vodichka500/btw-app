import { adminProcedure, protectedProcedure, router } from "../trpc";
import {
  AdminUpdateUserSchema,
  CreateUserSchema,
  DeleteUserSchema,
  UpdateProfileSchema,
} from "@btw-app/shared";
import { TRPCError } from "@trpc/server";
import { auth } from "../lib/auth";

export const userRouter = router({
  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          tgChatId: input.tgChatId,
          alfaEmail: input.alfaEmail,
          alfaToken: input.alfaToken,
        },
      });

      return updatedUser;
    }),

  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tgChatId: true,
        alfaEmail: true,
        createdAt: true,
      },
    });
  }),

  create: adminProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input }) => {
      try {
        const res = await auth.api.signUpEmail({
          headers: new Headers(),
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            role: input.role,
          },
        });

        return res.user;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Błąd podczas tworzenia użytkownika",
        });
      }
    }),

  updateByAdmin: adminProcedure
    .input(AdminUpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
        },
      });
    }),

  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie możesz usunąć samego siebie!",
        });
      }

      await ctx.db.user.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
