import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@btw-app/shared";
import { auth } from "./lib/auth";
import superjson from "superjson";

export const createContext = async ({ req, res }: { req: any; res: any }) => {
  let session = null;
  try {
    // Пытаемся достать сессию (передаем req.headers от Fastify)
    session = await auth.api.getSession({
      headers: req.headers,
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
  transformer: superjson, // 🔥 Добавь это, чтобы даты летали красиво
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Защищенная процедура (выдаст ошибку, если юзер не залогинен)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});
