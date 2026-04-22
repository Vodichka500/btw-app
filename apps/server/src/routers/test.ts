import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const testRouter = router({
  // Простой пинг-понг
  ping: publicProcedure.query(() => {
    return {
      message: "pong лох",
      timestamp: new Date().toISOString(),
    };
  }),

  // Тест передачи аргументов
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello, ${input.name ?? "Guest"}!`,
      };
    }),

  // Тест базы данных
  dbCheck: publicProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.user.count();
    return {
      status: "connected",
      usersInDb: count,
    };
  }),
});
