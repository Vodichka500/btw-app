import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const metaRouter = router({
  getAppInfo: publicProcedure.query(() => {
    try {
      const serverVersion = process.env.CURRENT_SERVER_VERSION;
      const minClientVersion = process.env.MIN_REQUIRED_CLIENT_VERSION;

      // Если хотя бы одной переменной нет — бросаем критическую ошибку
      if (!serverVersion || !minClientVersion) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "CRITICAL: CURRENT_SERVER_VERSION lub MIN_REQUIRED_CLIENT_VERSION nie są zdefiniowane w pliku .env!",
        });
      }

      return {
        serverVersion,
        minClientVersion,
      };
    } catch (error) {
      console.error("[META ROUTER ERROR]:", error);
      throw error;
    }
  }),
});
