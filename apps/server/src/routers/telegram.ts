import { router, adminProcedure } from "../trpc";
import { z } from "zod";

export const telegramRouter = router({
  // Базовый метод отправки одного сообщения
  sendMessage: adminProcedure
    .input(
      z.object({
        chatId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // ==========================================
      // SIMULATE TELEGRAM API
      // В будущем: await bot.telegram.sendMessage(input.chatId, input.text)
      // ==========================================

      // Имитация случайной ошибки сети для тестов (в проде уберешь)
      if (Math.random() < 0.05) throw new Error("Telegram API timeout");

      return { success: true, timestamp: Date.now() };
    }),
});
