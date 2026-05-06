import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { customerRouter } from "../src/routers/customer";
import { db } from "@btw-app/db";
import { clearDatabase } from "./setup";
import { telegramRouter } from "../src/routers/telegram";

describe("tRPC Middlewares (Авторизация)", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("Должен запрещать доступ к managerProcedure, если у пользователя нет прав менеджера", async () => {
    const ctx = {
      db: db,
      user: { id: "test-user", role: "TEACHER" as const },
      session: { id: "fake-session-123" }, // 🔥 Добавили фейковую сессию
      req: {} as any,
      res: {} as any,
    };

    const caller = customerRouter.createCaller(ctx as any);

    await assert.rejects(
      async () => caller.getSavedCustomers({ page: 1, limit: 10 }),
      (err: any) => {
        return err.code === "FORBIDDEN";
      },
    );
  });

  it("Должен запрещать доступ к adminProcedure, если у пользователя нет прав aдмина", async () => {
    const ctx = {
      db: db,
      user: { id: "test-user", role: "TEACHER" as const },
      session: { id: "fake-session-123" }, // 🔥 Добавили фейковую сессию
      req: {} as any,
      res: {} as any,
    };

    const caller = telegramRouter.createCaller(ctx as any);

    await assert.rejects(
      async () => caller.logout(),
      (err: any) => {
        return err.code === "FORBIDDEN";
      },
    );
  });

  it("Должен пропускать запрос к managerProcedure, если роль Admin", async () => {
    const ctx = {
      db: db,
      user: { id: "admin-user", role: "ADMIN" as const },
      session: { id: "fake-session-124" }, // 🔥 И здесь тоже
      req: {} as any,
      res: {} as any,
    };

    const caller = customerRouter.createCaller(ctx as any);

    const result = await caller.getSavedCustomers({ page: 1, limit: 10 });

    assert.ok(result.items);
    assert.deepStrictEqual(result.items, []);
  });
});
