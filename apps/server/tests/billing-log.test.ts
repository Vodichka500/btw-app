import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { billingLogRouter } from "../src/routers/billing-log";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Billing Log Router", () => {
  const ctx = {
    db,
    user: { id: "manager", role: "MANAGER" as const },
    session: { id: "session-123" },
    req: {},
    res: {},
  };
  const caller = billingLogRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();

    await ctx.db.customer.create({
      data: {
        id: 1,
        name: "Ivan",
        alfaId: 1,
        note: "",
        isSelfPaid: false,
      },
    });
  });


  it("Должны возвращаться логи с привязанным именем клиента", async () => {
    await db.billingLog.create({
      data: {
        alfaId: 1,
        year: 2025,
        month: 0,
        amountCalculated: 100,
        messageBody: "Message",
        status: "SUCCESS",
      },
    });

    const result = await caller.get({ month: 0, year: 2025 });

    assert.ok(result);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].messageBody, "Message");
    assert.strictEqual(result[0].customerName, "Ivan");
  });

  it("Должны возвращаться логи только за заданный месяц", async () => {
    await db.billingLog.createMany({
      data: [
        {
          alfaId: 1,
          year: 2025,
          month: 0,
          amountCalculated: 100,
          messageBody: "Message 1",
          status: "SUCCESS",
        },
        {
          alfaId: 1,
          year: 2025,
          month: 1,
          amountCalculated: 100,
          messageBody: "Message 2",
          status: "SUCCESS",
        },
      ],
    });

    const result = await caller.get({ month: 0, year: 2025 });

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].month, 0); // Месяц 1 сюда не попал
  });


  it("Должен успешно создавать новый лог", async () => {
    const result = await caller.add({
      alfaId: 1,
      year: 2025,
      month: 5,
      amountCalculated: 500,
      messageBody: "Новый счет",
      status: "SUCCESS",
    });

    assert.ok(result.id);

    const savedLog = await db.billingLog.findUnique({
      where: { id: result.id },
    });
    assert.ok(savedLog);
    assert.strictEqual(savedLog.messageBody, "Новый счет");
  });

  it("Должен возвращать ошибку валидации при создании лога с неполными данными", async () => {
    await assert.rejects(
      async () =>
        await caller.add({
          alfaId: 1,
          messageBody: "Новый счет",
        } as any),
      (err: any) => err.code === "BAD_REQUEST",
    );
  });


  it("Должен успешно удалять лог", async () => {
    const log = await db.billingLog.create({
      data: {
        alfaId: 1,
        year: 2025,
        month: 0,
        amountCalculated: 100,
        messageBody: "Удаляй",
        status: "SUCCESS",
      },
    });

    await caller.delete({ id: log.id });

    const deletedLog = await db.billingLog.findUnique({
      where: { id: log.id },
    });
    assert.strictEqual(deletedLog, null);
  });
});
