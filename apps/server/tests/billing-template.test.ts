import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { billingTemplateRouter } from "../src/routers/billing-template";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";

describe("Billing Template Router (CRUD)", () => {
  const ctx = {
    db,
    user: { id: "manager", role: "MANAGER" as const },
    session: { id: "session-123" },
    req: {},
    res: {},
  };
  const caller = billingTemplateRouter.createCaller(ctx as any);

  beforeEach(async () => {
    await clearDatabase();
  });

  it("Должен возвращать пустой массив, если шаблонов нет", async () => {
    const result = await caller.getAll();
    assert.ok(result);
    assert.deepStrictEqual(result, []);
  });

  it("Должен создать шаблон, если переданы данные", async () => {
    const result = await caller.create({
      name: "Шаблон 1",
      body: "Текст шаблона",
    });

    assert.ok(result.id);
    assert.strictEqual(result.name, "Шаблон 1");

    const savedInDb = await db.billingTemplate.findUnique({
      where: { id: result.id },
    });
    assert.ok(savedInDb);
    assert.strictEqual(savedInDb.body, "Текст шаблона");
  });

  it("Должен вернуть ошибку, если при создании переданы невалидные данные", async () => {
    await assert.rejects(
      async () =>
        await caller.create({
          name: "a",
          body: null as any, // Обходим TS для проверки рантайма
        }),
      (err: any) => {
        return err.code === "BAD_REQUEST";
      },
    );
  });

  it("Должен вернуть шаблоны от новых к старым, если есть", async () => {
    await caller.create({
      name: "a",
      body: "a",
    });
    await caller.create({
      name: "b",
      body: "b",
    });

    const result = await caller.getAll();
    assert.ok(result);
    assert.strictEqual(result[0].name, "b");
  });

  it("Должен вернуть шаблон если передан валидный ид", async () => {
    const savedInDb = await db.billingTemplate.create({
      data: {
        name: "Шаблон 1",
        body: "Текст шаблона",
      },
    });
    const result = await caller.getById({ id: savedInDb.id });
    assert.ok(result);
    assert.strictEqual(result.body, "Текст шаблона");
  });

  it("Должен вернуть null если передан невалидный ид", async () => {
    const result = await caller.getById({ id: 99999 });
    assert.strictEqual(result, null);
  });


  it("Должен обновить существующий шаблон", async () => {
    const template = await db.billingTemplate.create({
      data: { name: "Старое имя", body: "Старый текст" },
    });

    const result = await caller.update({
      id: template.id,
      name: "Новое имя",
      body: "Новый текст",
    });

    assert.strictEqual(result.name, "Новое имя");

    const updatedInDb = await db.billingTemplate.findUnique({
      where: { id: template.id },
    });
    assert.ok(updatedInDb);
    assert.strictEqual(updatedInDb.body, "Новый текст");
  });

  it("Должен вернуть ошибку при обновлении несуществующего шаблона", async () => {
    await assert.rejects(
      async () =>
        await caller.update({
          id: 99999,
          name: "Имя",
          body: "Текст",
        }),
      (err: any) =>
        err.code === "INTERNAL_SERVER_ERROR" ||
        err.message.includes("not found"),
    );
  });

  it("Должен удалить существующий шаблон", async () => {
    const template = await db.billingTemplate.create({
      data: { name: "Шаблон под снос", body: "Скоро меня не станет" },
    });

    await caller.delete({ id: template.id });

    const deletedFromDb = await db.billingTemplate.findUnique({
      where: { id: template.id },
    });

    assert.strictEqual(deletedFromDb, null);
  });

  it("Должен вернуть ошибку при удалении несуществующего шаблона", async () => {
    await assert.rejects(
      async () => await caller.delete({ id: 99999 }),
      (err: any) =>
        err.code === "INTERNAL_SERVER_ERROR" ||
        err.message.includes("not found"),
    );
  });
});
