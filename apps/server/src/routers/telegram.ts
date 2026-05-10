import {
  router,
  adminProcedure,
  managerProcedure,
  publicProcedure,
} from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";

const API_ID = parseInt(process.env.TELEGRAM_API_ID || "2040");
const API_HASH =
  process.env.TELEGRAM_API_HASH || "b18441a1ff607e10a989891a5462e627";
const MAX_MESSAGE_LENGTH = 4000;

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
    {
      connectionRetries: 5,
      timeout: 30000,             // 30 секунд на ожидание ответа
      requestRetries: 3,          // Сколько раз пытаться отправить сам запрос (sendMessage)
      autoReconnect: true,        // Включаем автореконнект под капотом
      useWSS: false               // Можно попробовать true, WebSockets реже блочатся провайдерами
    }
  );

  sendingClient.onError = async (err) => {
    if (err.message && err.message.includes("TIMEOUT")) {
      console.warn(
        "⚠️ GramJS: Потеряно соединение с фоновым лупом (TIMEOUT). Ожидаем реконнект...",
      );
    } else {
      console.error("❌ Неизвестная ошибка GramJS:", err);
    }
  };

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

        let { text } = input;

        // 1. Если текст помещается в одно сообщение, отправляем как обычно
        if (text.length <= MAX_MESSAGE_LENGTH) {
          await client.sendMessage(input.chatId, { message: text });
          return { success: true, timestamp: Date.now() };
        }

        // 2. Если текст длинный, разбиваем его на массив кусков (chunks)
        const chunks: string[] = [];

        while (text.length > 0) {
          if (text.length <= MAX_MESSAGE_LENGTH) {
            chunks.push(text);
            break;
          }

          // Ищем последний перенос строки (\n) в пределах лимита
          let sliceIndex = text.lastIndexOf("\n", MAX_MESSAGE_LENGTH);

          // Если переносов строки нет (сплошной монолитный текст), режем жестко
          if (sliceIndex === -1) {
            sliceIndex = MAX_MESSAGE_LENGTH;
          }

          chunks.push(text.slice(0, sliceIndex));
          text = text.slice(sliceIndex).trimStart(); // Убираем пробелы и переносы в начале следующего куска
        }

        // 3. Отправляем каждый кусок по очереди, дожидаясь успешной отправки предыдущего
        for (const chunk of chunks) {
          await client.sendMessage(input.chatId, { message: chunk });

          // Опционально: можно добавить небольшую задержку (например, 300мс)
          // между отправкой частей, чтобы не словить FloodWait, если частей очень много
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        return {
          success: true,
          timestamp: Date.now(),
          chunksSent: chunks.length,
        };
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

  exportTelegramUsers: managerProcedure.mutation(async ({ ctx }) => {
    try {
      // 1. Берем готового клиента из сессии
      const client = await getSendingClient(ctx);

      console.log("📥 Skanowanie dialogów z Telegrama...");

      // 2. Получаем все диалоги
      const dialogs = await client.getDialogs({});
      const records: any[] = [];

      for (const dialog of dialogs) {
        const entity = dialog.entity as any;

        // 3. Берем только личные переписки (исключаем группы, каналы и ботов)
        if (dialog.isUser && !entity?.bot) {
          records.push({
            tgId: entity?.id?.toString() || "",
            name: `${entity?.firstName || ""} ${entity?.lastName || ""}`.trim(),
            username: entity?.username ? `@${entity.username}` : "",
            phone: entity?.phone ? `+${entity.phone}` : "",
          });
        }
      }

      console.log(`✅ Znaleziono ${records.length} osób w dialogach.`);

      // Отдаем массив на фронтенд
      return { success: true, records };
    } catch (error: any) {
      console.error("Błąd pobierania dialogów:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Nie udało się pobrać dialogów z Telegrama",
      });
    }
  }),

  sendReportByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
        message: z.string(),
        secret: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.secret !== 'BTW_REPORTS_2026') {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Brak dostępu / Отказано в доступе',
        });
      }

      try {
        const client = await getSendingClient(ctx);
        const targetUsername = input.username.replace("@", "").trim();

        // В GramJS получение сущности по юзернейму делается через getEntity
        const entity = await client.getEntity(targetUsername);

        // Отправляем сообщение
        await client.sendMessage(entity, { message: input.message });

        return { status: "success" };
      } catch (error: any) {
        console.error("Błąd wysyłania po username:", error);
        const errMsg = error.message || error.errorMessage || "";

        // Обработка несуществующего username (аналог UsernameNotOccupiedError)
        if (
          errMsg.includes("No user has") ||
          errMsg.includes("USERNAME_NOT_OCCUPIED")
        ) {
          return {
            status: "error",
            message: "❌ Username не найден или удален",
          };
        }

        // Если юзер ограничил входящие сообщения
        if (errMsg.includes("USER_BANNED_IN_CHANNEL") || errMsg.includes("PRIVACY")) {
          return {
            status: "error",
            message: "🔒 У пользователя закрыты личные сообщения",
          };
        }

        return { status: "error", message: `Błąd: ${errMsg}` };
      }
    }),
});
