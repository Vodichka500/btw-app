// apps/server/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@btw-app/db";
import { FullSessionData } from "./lib/auth";
import superjson from "superjson";


export const createContext = async ({ req }: { req: any; res?: any }) => {
  let sessionData: FullSessionData | null = null;

  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]; // Отрезаем "Bearer "

      const session = await db.session.findUnique({
        where: { token: token }, // ИЛИ where: { id: token } - зависит от того, как Better Auth хранит это в твоей базе
        include: { user: true },
      });

      if (session && session.expiresAt > new Date()) {
        sessionData = {
          session: session,
          user: session.user as any,
        };
      }
    }
  } catch (error) {
    console.error("❌ [tRPC Context] Ошибка поиска сессии:", error);
  }

  return {
    db,
    user: sessionData?.user ?? null,
    session: sessionData?.session ?? null,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Вы не авторизованы",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Недостаточно прав для выполнения этого действия",
    });
  }

  return next({ ctx });
});
