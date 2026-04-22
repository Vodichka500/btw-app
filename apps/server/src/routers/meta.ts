import { router, publicProcedure } from "../trpc";

const CURRENT_SERVER_VERSION = "2.0.0";
const MIN_REQUIRED_CLIENT_VERSION = "2.1.0";

export const metaRouter = router({
  getAppInfo: publicProcedure.query(() => {
    return {
      serverVersion: CURRENT_SERVER_VERSION, // Фронт ищет это
      minClientVersion: MIN_REQUIRED_CLIENT_VERSION, // И это
    };
  }),
});
