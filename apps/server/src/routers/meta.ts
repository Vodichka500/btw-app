import { router, publicProcedure } from "../trpc";

const CURRENT_SERVER_VERSION = "1.0.1";
const MIN_REQUIRED_CLIENT_VERSION = "2.0.1";

export const metaRouter = router({
  getAppInfo: publicProcedure.query(() => {
    return {
      serverVersion: CURRENT_SERVER_VERSION, // Фронт ищет это
      minClientVersion: MIN_REQUIRED_CLIENT_VERSION, // И это
    };
  }),
});
