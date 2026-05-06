import { router, publicProcedure } from "../trpc";

const CURRENT_SERVER_VERSION = "2.2.0";
const MIN_REQUIRED_CLIENT_VERSION = "2.2.0";

export const metaRouter = router({
  getAppInfo: publicProcedure.query(() => {
    return {
      serverVersion: CURRENT_SERVER_VERSION, // Фронт ищет это
      minClientVersion: MIN_REQUIRED_CLIENT_VERSION, // И это
    };
  }),
});
