import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { messageRouter } from "../src/routers/message";
import { messageLogRouter } from "../src/routers/message-log";
import { telegramRouter } from "../src/routers/telegram";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Message & MessageLog Routers", () => {
  const ctx = {
    db,
    user: { id: "m1", role: "MANAGER" as const },
    session: { id: "s1" },
    req: {},
    res: {},
  };

  const msgCaller = messageRouter.createCaller(ctx as any);
  const logCaller = messageLogRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  describe("messageRouter.sendSingleMessage", () => {
    it("Должен успешно отправить сообщение студенту и создать SUCCESS лог", async () => {
      // Создаем клиента, чтобы не было ошибки внешнего ключа
      await db.customer.create({
        data: { alfaId: 100, name: "Ivan", isSelfPaid: true },
      });

      mock.method(telegramRouter, "createCaller", () => ({
        sendMessage: async () => ({ success: true }),
      }));

      const result = await msgCaller.sendSingleMessage({
        alfaId: 100,
        messageBody: "Cześć!",
        targetAudience: "STUDENT",
        studentTgChatId: "tg-student-123",
        parentTgChatId: null,
      });

      assert.ok(result.success);
      const log = await db.messageLog.findFirst({ where: { alfaId: 100 } });
      assert.strictEqual(log?.status, "SUCCESS");
    });

    it("Должен создать FAILED лог, если не передан ID целевой аудитории", async () => {
      // Снова создаем клиента для ID 200
      await db.customer.create({
        data: { alfaId: 200, name: "Marek", isSelfPaid: false },
      });

      await assert.rejects(
        async () =>
          await msgCaller.sendSingleMessage({
            alfaId: 200,
            messageBody: "Hello",
            targetAudience: "PARENT",
            studentTgChatId: "tg-123",
            parentTgChatId: null,
          }),
        (err: any) => err.message.includes("Brak Telegram ID"),
      );

      const log = await db.messageLog.findFirst({ where: { alfaId: 200 } });
      assert.strictEqual(log?.status, "FAILED");
    });

    it("Должен создать FAILED лог, если Telegram API вернул ошибку", async () => {
      await db.customer.create({
        data: { alfaId: 300, name: "Anna", isSelfPaid: true },
      });

      mock.method(telegramRouter, "createCaller", () => ({
        sendMessage: async () => {
          throw new Error("Blocked by user");
        },
      }));

      await assert.rejects(
        async () =>
          await msgCaller.sendSingleMessage({
            alfaId: 300,
            messageBody: "Test",
            targetAudience: "STUDENT",
            studentTgChatId: "tg-123",
            parentTgChatId: null,
          }),
      );

      const log = await db.messageLog.findFirst({ where: { alfaId: 300 } });
      assert.strictEqual(log?.status, "FAILED");
      assert.strictEqual(log?.errorReason, "Blocked by user");
    });
  });

  describe("messageLogRouter.get", () => {
    it("Должен возвращать логи с именами клиентов и работать фильтр поиска", async () => {
      // Создаем ДВУХ клиентов для ДВУХ логов
      await db.customer.create({
        data: { alfaId: 500, name: "Александр", isSelfPaid: true },
      });
      await db.customer.create({
        data: { alfaId: 600, name: "Неизвестный", isSelfPaid: true },
      });

      await db.messageLog.createMany({
        data: [
          { alfaId: 500, messageBody: "Msg 1", status: "SUCCESS" },
          { alfaId: 600, messageBody: "Msg 2", status: "FAILED" },
        ],
      });

      const resSearch = await logCaller.get({
        page: 1,
        limit: 10,
        search: "Алекс",
      });
      assert.strictEqual(resSearch.items.length, 1);
      assert.strictEqual(resSearch.items[0].customerName, "Александр");
    });

    it("Должен фильтровать логи по статусу", async () => {
      // Создаем клиентов для ID 1 и 2
      await db.customer.createMany({
        data: [
          { alfaId: 1, name: "User 1", isSelfPaid: true },
          { alfaId: 2, name: "User 2", isSelfPaid: true },
        ],
      });

      await db.messageLog.createMany({
        data: [
          { alfaId: 1, messageBody: "S1", status: "SUCCESS" },
          { alfaId: 2, messageBody: "F1", status: "FAILED" },
        ],
      });

      const res = await logCaller.get({ page: 1, limit: 10, status: "FAILED" });
      assert.strictEqual(res.items.length, 1);
      assert.strictEqual(res.items[0].status, "FAILED");
    });
  });
});
