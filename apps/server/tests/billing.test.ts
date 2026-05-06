import { describe, it, beforeEach, mock } from "node:test";
import * as assert from "node:assert";
import { billingRouter } from "../src/routers/billing";
import { alfaBilling } from "../src/routers/alfa/alfa-billing";
import { telegramRouter } from "../src/routers/telegram";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Billing Router (Оркестратор)", () => {
  const ctx = {
    db,
    user: { id: "manager", role: "MANAGER" as const },
    session: { id: "session-123" },
    req: {},
    res: {},
  };
  const caller = billingRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();
    mock.restoreAll();
  });

  // --- ТЕСТЫ ДЛЯ getDashboardData ---

  it("Должен корректно склеивать данные из AlfaCRM и локальной БД", async () => {
    await db.customer.create({
      data: {
        id: 1,
        alfaId: 100,
        name: "Иван",
        studentTgChatId: "tg-123",
        isSelfPaid: true,
      },
    });
    await db.alfaSubject.create({
      data: { id: 1, alfaId: 10, name: "Математика" },
    });

    mock.method(alfaBilling, "createCaller", () => ({
      getBillingReport: async () => ({
        fetchedAt: Date.now(),
        items: [
          {
            alfaId: 100,
            name: "Иван из CRM",
            totalToPay: 5000,
            subjects: [{ id: 10, quantity: 4 }],
          },
        ],
      }),
    }));

    const result = await caller.getDashboardData({
      alfaTempToken: "fake",
      month: 5,
      year: 2026,
    });

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].studentTgChatId, "tg-123");
    assert.strictEqual(result.items[0].subjects.length, 1);
    assert.strictEqual(result.items[0].subjects[0].name, "Математика");
  });

  it("Должен помечать isSent: true, если в БД есть успешный лог", async () => {
    await db.customer.create({
      data: {
        id: 1,
        alfaId: 100,
        name: "Иван",
        studentTgChatId: "tg-123",
        isSelfPaid: true,
      },
    });

    // Создаем лог отправки
    await db.billingLog.create({
      data: {
        alfaId: 100,
        year: 2026,
        month: 5,
        amountCalculated: 100,
        messageBody: "Message",
        status: "SUCCESS",
      },
    });

    mock.method(alfaBilling, "createCaller", () => ({
      getBillingReport: async () => ({
        fetchedAt: Date.now(),
        items: [
          { alfaId: 100, name: "Иван из CRM", totalToPay: 5000, subjects: [] },
        ],
      }),
    }));

    const result = await caller.getDashboardData({
      alfaTempToken: "fake",
      month: 5,
      year: 2026,
    });

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].isSent, true); // Проверка статуса
  });

  it("Не должен падать, если CRM вернула ученика и предмет, которых нет в локальной БД", async () => {
    // База данных пустая! Никаких учеников и предметов нет.
    mock.method(alfaBilling, "createCaller", () => ({
      getBillingReport: async () => ({
        fetchedAt: Date.now(),
        items: [
          {
            alfaId: 999,
            name: "Новый из CRM",
            totalToPay: 1000,
            subjects: [{ id: 777, quantity: 2 }],
          },
        ],
      }),
    }));

    const result = await caller.getDashboardData({
      alfaTempToken: "fake",
      month: 5,
      year: 2026,
    });

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].studentTgChatId, null); // Фоллбек на null
    assert.strictEqual(result.items[0].subjects[0].name, "ID: 777"); // Фоллбек названия предмета
  });

  // --- ТЕСТЫ ДЛЯ sendSingleBilling ---

  it("Должен успешно отправлять сообщение и писать SUCCESS лог", async () => {
    mock.method(telegramRouter, "createCaller", () => ({
      sendMessage: async () => ({ success: true }),
    }));

    await db.customer.create({
      data: { id: 1, name: "Ivan", alfaId: 100, note: "", isSelfPaid: false },
    });

    const result = await caller.sendSingleBilling({
      month: 5,
      year: 2026,
      message: {
        alfaId: 100,
        messageBody: "Message",
        amountCalculated: 100,
        name: "Ivan",
        isSelfPaid: false,
        studentTgChatId: "tg-123",
        parentTgChatId: "tg-345",
      },
    });

    assert.ok(result.success);

    const dbLogs = await db.billingLog.findMany();
    assert.strictEqual(dbLogs.length, 1);
    assert.strictEqual(dbLogs[0].status, "SUCCESS");
  });

  it("Должен возвращать ошибку и НЕ писать логи, если сообщение пустое или нет TG ID", async () => {
    await assert.rejects(
      async () =>
        caller.sendSingleBilling({
          month: 5,
          year: 2026,
          message: {
            alfaId: 100,
            messageBody: "   ", // Пустое сообщение!
            amountCalculated: 100,
            name: "Ivan",
            isSelfPaid: true,
            studentTgChatId: "tg-123",
            parentTgChatId: null,
          },
        }),
      (err: any) => err.message.includes("Pusta wiadomość"),
    );

    // Убеждаемся, что кривая попытка не замусорила базу логов
    const dbLogs = await db.billingLog.findMany();
    assert.strictEqual(dbLogs.length, 0);
  });

  it("Должен писать FAILED лог и прокидывать ошибку, если отправка в Telegram упала", async () => {
    // 1. Мокаем ошибку от Телеграма (например, юзер заблочил бота)
    mock.method(telegramRouter, "createCaller", () => ({
      sendMessage: async () => {
        throw new Error("User blocked the bot");
      },
    }));

    await db.customer.create({
      data: { id: 1, name: "Ivan", alfaId: 100, note: "", isSelfPaid: true },
    });

    // 2. Ожидаем, что роутер честно выкинет ошибку наверх
    await assert.rejects(
      async () =>
        caller.sendSingleBilling({
          month: 5,
          year: 2026,
          message: {
            alfaId: 100,
            messageBody: "Счет",
            amountCalculated: 100,
            name: "Ivan",
            isSelfPaid: true,
            studentTgChatId: "tg-123",
            parentTgChatId: null,
          },
        }),
      (err: any) => err.message.includes("User blocked the bot"),
    );

    // 3. НО при этом в базу ДОЛЖНА записаться попытка со статусом FAILED
    const dbLogs = await db.billingLog.findMany();
    assert.strictEqual(dbLogs.length, 1);
    assert.strictEqual(dbLogs[0].status, "FAILED");
  });
});
