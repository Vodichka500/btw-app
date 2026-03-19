// apps/server/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@btw-app/db";
import { auth, FullSessionData } from "./lib/auth";
import superjson from "superjson";


export const createContext = async ({ req, res }: { req: any; res: any }) => {
  const webHeaders = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      webHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      webHeaders.set(key, value.join(", "));
    }
  });

  let session: FullSessionData | null = null;
  try {
    session = await auth.api.getSession({
      headers: webHeaders,
    });
  } catch (error) {
  }

  return {
    db,
    user: session?.user ?? null,
    session: session?.session ?? null,
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
