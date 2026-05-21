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

export let isCacheReady = false;
export let isCacheWarming = false;

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
    try {
      await sendingClient.disconnect();
    } catch (e) {}
  }

  sendingClient = new TelegramClient(
    new StringSession(session.sessionString),
    API_ID,
    API_HASH,
    {
      connectionRetries: 1,
      timeout: 5000,
      requestRetries: 0,
      autoReconnect: true,
      useWSS: true, // 🟢 Оставляем, это маскирует трафик от DPI
    },
  );

  sendingClient.onError = async (err) => {
    if (!err.message?.includes("TIMEOUT")) {
      console.error("❌ Ошибка GramJS:", err);
    }
  };

  // 🔴 1. Проверяем доступность серверов ТГ с жестким таймаутом
  try {
    await Promise.race([
      sendingClient.connect(),
      new Promise((_, r) =>
        setTimeout(() => r(new Error("CONNECT_TIMEOUT")), 5000),
      ),
    ]);
  } catch (error) {
    // Если за 5 секунд не подключились - провайдер режет трафик
    throw new TRPCError({
      code: "TIMEOUT",
      message:
        "❌ Nie można połączyć się z serwerami Telegram. Spróbuj ponownie później.",
    });
  }

  activeSessionString = session.sessionString;

  // 🔴 2. Фоновый сбор кэша ВСЕХ диалогов (чтобы не было Peer id invalid)
  if (!isCacheReady && !isCacheWarming) {
    isCacheWarming = true;
    console.log("⏳ Rozpoczęto pobieranie cache w tle...");

    // Запускаем сбор без await! Он пойдет в фоне.
    sendingClient
      .getDialogs({})
      .then(() => {
        isCacheReady = true;
        isCacheWarming = false;
        console.log("✅ Cache dialogów gotowy!");
      })
      .catch((e) => {
        isCacheWarming = false;
        console.warn("⚠️ Błąd pobierania cache w tle", e.message);
      });

    // Даем фору 3 секунды. Если у юзера мало чатов, они успеют скачаться
    // до того, как функция вернет клиента и начнется отправка
    await new Promise((r) => setTimeout(r, 3000));
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

        // 1. Разбиваем текст на чанки (работает и для коротких, и для длинных сообщений)
        const chunks: string[] = [];

        while (text.length > 0) {
          if (text.length <= MAX_MESSAGE_LENGTH) {
            chunks.push(text);
            break;
          }

          let sliceIndex = text.lastIndexOf("\n", MAX_MESSAGE_LENGTH);
          if (sliceIndex === -1) {
            sliceIndex = MAX_MESSAGE_LENGTH;
          }

          chunks.push(text.slice(0, sliceIndex));
          text = text.slice(sliceIndex).trimStart();
        }

        // 2. Отправляем куски с жестким Fail-Fast таймаутом
        for (const chunk of chunks) {
          const sendPromise = client.sendMessage(input.chatId, {
            message: chunk,
          });

          // Даем ровно 5 секунд на отправку
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("APP_TIMEOUT")), 5000),
          );

          try {
            await Promise.race([sendPromise, timeoutPromise]);
          } catch (e: any) {
            // Если сработал таймаут - жестко обрываем коннект
            if (e.message === "APP_TIMEOUT") {
              console.error(
                "⏳ Таймаут отправки! Убиваем соединение во избежание зомби-сообщений.",
              );

              await client.disconnect(); // При следующем запросе getSendingClient создаст чистого клиента

              throw new TRPCError({
                code: "TIMEOUT",
                message:
                  "Serwer Telegram nie odpowiada. Wiadomość NIE została wysłana.",
              });
            }
            throw e; // Пробрасываем реальные ошибки GramJS дальше в catch
          }

          // Небольшая задержка, чтобы не словить FloodWait на больших текстах
          if (chunks.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        return {
          success: true,
          timestamp: Date.now(),
          chunksSent: chunks.length,
        };
      } catch (error: any) {
        console.error("Błąd wysyłania TG:", error);

        if (error instanceof TRPCError) throw error;

        const errMsg = error.message || error.errorMessage || "";

        // 🔴 Умное обновление кэша
        if (
          errMsg.includes("Could not find the input entity") ||
          errMsg.includes("Peer id invalid")
        ) {
          // Сбрасываем флаги! При следующем запросе клиент скачает свежие диалоги.
          isCacheReady = false;
          isCacheWarming = false;

          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "⏳ Trwa pobieranie nowych kontaktów z Telegrama. Poczekaj 5 sekund i spróbuj ponownie.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errMsg || "Nie udało się wysłać wiadomości",
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.secret !== "BTW_REPORTS_2026") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Brak dostępu / Отказано в доступе",
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
        if (
          errMsg.includes("USER_BANNED_IN_CHANNEL") ||
          errMsg.includes("PRIVACY")
        ) {
          return {
            status: "error",
            message: "🔒 У пользователя закрыты личные сообщения",
          };
        }

        return { status: "error", message: `Błąd: ${errMsg}` };
      }
    }),
});
