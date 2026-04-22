import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@btw-app/db";
import { auth, FullSessionData } from "./lib/auth";
import superjson from "superjson";


export const createContext = async ({ req, res }: { req: any; res?: any }) => {
  let sessionData: FullSessionData | null = null;

  try {

    const webHeaders = new Headers();
    if (req.headers) {
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          webHeaders.append(key, value);
        } else if (Array.isArray(value)) {
          webHeaders.append(key, value.join(", "));
        }
      });
    }

    const nativeSession = await auth.api.getSession({
      headers: webHeaders,
    });

    if (nativeSession?.session && nativeSession?.user) {
      sessionData = {
        session: nativeSession.session as any,
        user: nativeSession.user as any,
      };
    }

    if (!sessionData) {
      const authHeader = req.headers?.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        const session = await db.session.findUnique({
          where: { token: token },
          include: { user: true },
        });

        if (session && session.expiresAt > new Date()) {
          sessionData = {
            session: session as any,
            user: session.user as any,
          };
        }
      }
    }
  } catch (error) {
    console.error("❌ [tRPC Context] Ошибка поиска сессии:", error);
  }

  return {
    req,
    res,
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

export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN" && ctx.user.role !== "MANAGER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Недостаточно прав. Требуется роль Менеджера.",
    });
  }

  return next({ ctx });
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
