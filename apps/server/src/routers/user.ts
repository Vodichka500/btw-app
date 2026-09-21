import { managerProcedure, protectedProcedure, router } from "../trpc";
import {
  AdminUpdateUserSchema,
  CreateUserSchema,
  DeleteUserSchema,
  UpdateProfileSchema,
} from "@btw-app/shared";
import { TRPCError } from "@trpc/server";
import { auth } from "../lib/auth";

const parseBirthDate = (value: string | null | undefined) =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

const getMonthDay = (date: Date) =>
  `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

const getTodayMonthDay = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIMEZONE || "Europe/Minsk",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${month}-${day}`;
};

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

  getAll: managerProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tgChatId: true,
        alfaEmail: true,
        alfaToken: true,
        birthDate: true,
        createdAt: true,
        teacherId: true,
        teacher: {
          select: { id: true, name: true },
        },
      },
    });
  }),

  create: managerProcedure
    .input(CreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await auth.api.signUpEmail({
          headers: new Headers(),
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            role: input.role,
            teacherId: input.teacherId ?? undefined,
            tgChatId: input.tgChatId ?? undefined,
            alfaEmail: input.alfaEmail ?? undefined,
            alfaToken: input.alfaToken ?? undefined,
          },
        });

        if (input.birthDate) {
          await ctx.db.user.update({
            where: { id: res.user.id },
            data: { birthDate: parseBirthDate(input.birthDate) },
          });
        }

        return res.user;
      } catch (error: any) {
        console.error(
          "Better Auth Full Error:",
          JSON.stringify(error, null, 2),
        );
        console.error("Error Object:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Błąd podczas tworzenia użytkownika",
        });
      }
    }),

  updateByAdmin: managerProcedure
    .input(AdminUpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          teacherId: input.teacherId ?? null,
          tgChatId: input.tgChatId,
          alfaEmail: input.alfaEmail,
          alfaToken: input.alfaToken,
          birthDate: parseBirthDate(input.birthDate),
        },
      });
    }),

  getBirthdaysToday: managerProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, name: true, birthDate: true },
      orderBy: { name: "asc" },
    });

    const today = getTodayMonthDay();
    return users
      .filter((user) => user.birthDate && getMonthDay(user.birthDate) === today)
      .map(({ id, name }) => ({ id, name: name || "Без имени" }));
  }),

  delete: managerProcedure
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
