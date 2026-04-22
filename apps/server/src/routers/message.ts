import { router, managerProcedure } from "../trpc";
import { telegramRouter } from "./telegram";
import { SendSingleMessageInputSchema } from "@btw-app/shared";

export const messageRouter = router({
  sendSingleMessage: managerProcedure
    .input(SendSingleMessageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const tgCaller = telegramRouter.createCaller(ctx);
      const {
        alfaId,
        messageBody,
        targetAudience,
        studentTgChatId,
        parentTgChatId,
      } = input;

      if (!messageBody || messageBody.trim() === "") {
        throw new Error("Pusta wiadomość");
      }

      const targetChatId =
        targetAudience === "STUDENT" ? studentTgChatId : parentTgChatId;

      if (!targetChatId) {
        const missingRole =
          targetAudience === "STUDENT" ? "ucznia" : "rodzica/opiekuna";
        const errorMessage = `Brak Telegram ID dla ${missingRole}`;

        await ctx.db.messageLog.create({
          data: {
            alfaId,
            messageBody,
            status: "FAILED",
            errorReason: errorMessage,
          },
        });

        throw new Error(errorMessage);
      }

      try {
        await tgCaller.sendMessage({ chatId: targetChatId, text: messageBody });

        await ctx.db.messageLog.create({
          data: { alfaId, messageBody, status: "SUCCESS", errorReason: null },
        });

        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "Nieznany błąd Telegram";

        await ctx.db.messageLog.create({
          data: {
            alfaId,
            messageBody,
            status: "FAILED",
            errorReason: errorMessage,
          },
        });

        throw new Error(errorMessage);
      }
    }),
});
