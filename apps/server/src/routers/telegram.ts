import { router, adminProcedure, managerProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";

const API_ID = parseInt(process.env.TELEGRAM_API_ID || "2040");
const API_HASH =
  process.env.TELEGRAM_API_HASH || "b18441a1ff607e10a989891a5462e627";


let authClient: TelegramClient | null = null;
let authPhoneCodeHash: string | null = null;
let authPhone: string | null = null;

let sendingClient: TelegramClient | null = null;
let activeSessionString: string | null = null;

async function getSendingClient(ctx: any) {
  const session = await ctx.db.telegramSession.findUnique({ where: { id: 1 } });

  if (!session?.sessionString) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Brak sesji Telegram. Zaloguj się w ustawieniach.",
    });
  }

  if (
    sendingClient &&
    sendingClient.connected &&
    activeSessionString === session.sessionString
  ) {
    return sendingClient;
  }

  if (sendingClient) {
    await sendingClient.disconnect();
  }

  sendingClient = new TelegramClient(
    new StringSession(session.sessionString),
    API_ID,
    API_HASH,
    { connectionRetries: 5 },
  );

  await sendingClient.connect();
  activeSessionString = session.sessionString;

  // 🔥 МАГИЯ ЗДЕСЬ: Прогреваем кэш!
  // Заставляем клиента скачать список диалогов.
  // Это подтянет все access_hash старых клиентов в память GramJS.
  try {
    console.log("Pobieranie dialogów do cache Telegrama...");
    await sendingClient.getDialogs({});
    console.log("Cache dialogów gotowy!");
  } catch (e) {
    console.warn("Nie udało się pobrać dialogów:", e);
  }

  return sendingClient;
}

export const telegramRouter = router({
  status: adminProcedure.query(async ({ ctx }) => {
    const session = await ctx.db.telegramSession.findUnique({
      where: { id: 1 },
    });
    return {
      isConnected: !!session?.sessionString,
      phoneNumber: session?.phoneNumber || null,
    };
  }),

  // 2. Шаг 1: Запрашиваем код
  sendCode: adminProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Убиваем старого клиента, если кто-то не дошел до конца авторизации
        if (authClient) {
          await authClient.disconnect();
        }

        // Создаем нового чистого клиента для входа
        authClient = new TelegramClient(
          new StringSession(""),
          API_ID,
          API_HASH,
          {
            connectionRetries: 5,
          },
        );

        await authClient.connect();

        // Отправляем запрос на код
        const result = await authClient.sendCode(
          { apiId: API_ID, apiHash: API_HASH },
          input.phone,
        );

        // Сохраняем хэш и телефон в памяти для следующего шага
        authPhoneCodeHash = result.phoneCodeHash;
        authPhone = input.phone;

        return { success: true };
      } catch (error: any) {
        console.error("Telegram sendCode error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.errorMessage || "Nie udało się wysłać kodu SMS",
        });
      }
    }),

  // 3. Шаг 2: Отправляем код
  submitCode: adminProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!authClient || !authPhoneCodeHash || !authPhone) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Sesja logowania wygasła. Spróbuj ponownie.",
        });
      }

      try {
        // Пытаемся залогиниться
        await authClient.invoke(
          new Api.auth.SignIn({
            phoneNumber: authPhone,
            phoneCodeHash: authPhoneCodeHash,
            phoneCode: input.code,
          }),
        );

        // Если код подошел и 2FA нет — сохраняем сессию
        const sessionString = (authClient.session as StringSession).save();

        await ctx.db.telegramSession.upsert({
          where: { id: 1 },
          update: { sessionString, phoneNumber: authPhone },
          create: { id: 1, sessionString, phoneNumber: authPhone },
        });

        return { status: "SUCCESS" };
      } catch (error: any) {
        // 🔥 Ловим облачный пароль (2FA)
        if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
          return { status: "NEEDS_PASSWORD" };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.errorMessage || "Nieprawidłowy kod",
        });
      }
    }),

  // 4. Шаг 3: Отправляем пароль (если сработал 2FA)
  submitPassword: adminProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!authClient || !authPhone) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Sesja logowania wygasła. Spróbuj ponownie.",
        });
      }

      try {
        // 🔥 В GramJS пароль передается через signInWithPassword
        // Обрати внимание, что password передается как асинхронная функция
        await authClient.signInWithPassword(
          { apiId: API_ID, apiHash: API_HASH },
          {
            password: async () => input.password,
            onError: (err) => {
              throw err;
            },
          },
        );

        // Пароль подошел, сохраняем сессию
        const sessionString = (authClient.session as StringSession).save();

        await ctx.db.telegramSession.upsert({
          where: { id: 1 },
          update: { sessionString, phoneNumber: authPhone },
          create: { id: 1, sessionString, phoneNumber: authPhone },
        });

        // Очищаем память
        authClient = null;
        authPhoneCodeHash = null;

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.errorMessage || error.message || "Nieprawidłowe hasło",
        });
      }
    }),

  // 5. Выход (Logout)
  logout: adminProcedure.mutation(async ({ ctx }) => {
    const session = await ctx.db.telegramSession.findUnique({
      where: { id: 1 },
    });

    if (session?.sessionString) {
      try {
        // Поднимаем клиента чисто чтобы послать команду LogOut на сервера ТГ
        const client = new TelegramClient(
          new StringSession(session.sessionString),
          API_ID,
          API_HASH,
          { connectionRetries: 1 },
        );
        await client.connect();
        await client.invoke(new Api.auth.LogOut());
        await client.disconnect();
      } catch (e) {
        console.warn("Nie udało się poprawnie wylogować z serwerów TG:", e);
      }
    }

    // Удаляем из нашей БД
    await ctx.db.telegramSession.delete({
      where: { id: 1 },
    });

    return { success: true };
  }),

  sendMessage: managerProcedure
    .input(
      z.object({
        chatId: z.string(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const client = await getSendingClient(ctx);

        await client.sendMessage(input.chatId, { message: input.text });

        return { success: true, timestamp: Date.now() };
      } catch (error: any) {
        console.error("Błąd wysyłania TG:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error.errorMessage ||
            error.message ||
            "Nie udało się wysłać wiadomości",
        });
      }
    }),
});
